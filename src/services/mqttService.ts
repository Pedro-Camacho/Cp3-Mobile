import Paho from 'paho-mqtt';

import { MQTT_OPTIONS } from '../config/mqttConfig';
import type {
  ConnectionSnapshot,
  MqttIncomingMessage,
  PublishResult,
} from '../types/mqtt';
import { parseBrokerUrl } from '../utils/validators';

type StatusListener = (snapshot: ConnectionSnapshot) => void;
type MessageListener = (message: MqttIncomingMessage) => void;
type Unsubscribe = () => void;

/** Códigos de erro do Paho mais comuns, traduzidos para o usuário. */
const PAHO_ERROR_MESSAGES: Record<number, string> = {
  1: 'Tempo de conexão esgotado. Verifique a URL e a porta WebSocket.',
  6: 'O broker recusou a conexão.',
  7: 'Erro de socket: não foi possível abrir o WebSocket com o broker.',
  8: 'A conexão com o broker foi encerrada.',
  9: 'Não foi possível conectar ao broker.',
};

function describeError(error: Paho.MQTTError): string {
  return PAHO_ERROR_MESSAGES[error.errorCode] ?? error.errorMessage ?? 'Erro desconhecido';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Camada de comunicação MQTT, isolada da interface.
 *
 * - Mantém um único cliente Paho por vez (conectar novamente descarta o anterior).
 * - Expõe listeners com função de cancelamento, para que os componentes
 *   removam seus callbacks no cleanup do useEffect e não haja eventos duplicados.
 * - Reconecta automaticamente com backoff exponencial após quedas inesperadas.
 */
class MqttService {
  private client: Paho.Client | null = null;
  private topics: string[] = [];
  private statusListeners = new Set<StatusListener>();
  private messageListeners = new Set<MessageListener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private snapshot: ConnectionSnapshot = {
    status: 'disconnected',
    brokerUrl: null,
    error: null,
    reconnectAttempt: 0,
  };

  getSnapshot(): ConnectionSnapshot {
    return this.snapshot;
  }

  isConnected(): boolean {
    return this.snapshot.status === 'connected' && this.client?.isConnected() === true;
  }

  /** Registra um listener de status. Ele é chamado imediatamente com o estado atual. */
  onStatusChange(listener: StatusListener): Unsubscribe {
    this.statusListeners.add(listener);
    listener(this.snapshot);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /** Registra um listener de mensagens recebidas. */
  onMessage(listener: MessageListener): Unsubscribe {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  /**
   * Define os tópicos que devem estar inscritos enquanto houver conexão.
   * Retorna uma função que cancela as inscrições.
   */
  subscribe(topics: readonly string[]): Unsubscribe {
    const added = topics.filter((topic) => !this.topics.includes(topic));
    this.topics = [...this.topics, ...added];
    if (this.isConnected()) {
      added.forEach((topic) => this.subscribeOnClient(topic));
    }
    return () => {
      this.topics = this.topics.filter((topic) => !added.includes(topic));
      if (this.isConnected()) {
        added.forEach((topic) => {
          try {
            this.client?.unsubscribe(topic);
          } catch {
            // Conexão caiu durante o cancelamento; nada a fazer.
          }
        });
      }
    };
  }

  connect(brokerUrl: string): void {
    const parsed = parseBrokerUrl(brokerUrl);
    if (!parsed.ok) {
      this.setSnapshot({ status: 'error', error: parsed.error, brokerUrl: brokerUrl.trim(), reconnectAttempt: 0 });
      return;
    }
    this.clearReconnectTimer();
    this.openClient(parsed.data.url, 0);
  }

  /** Desconexão solicitada pelo usuário: não dispara reconexão automática. */
  disconnect(): void {
    this.clearReconnectTimer();
    this.teardownClient();
    this.setSnapshot({ status: 'disconnected', error: null, reconnectAttempt: 0 });
  }

  /** Reconecta manualmente usando a última URL informada. */
  reconnect(): void {
    if (this.snapshot.brokerUrl) {
      this.connect(this.snapshot.brokerUrl);
    }
  }

  publish(topic: string, payload: string, retained = false): PublishResult {
    if (!this.client || !this.isConnected()) {
      return { ok: false, error: 'Sem conexão com o broker. Conecte-se antes de enviar comandos.' };
    }
    try {
      const message = new Paho.Message(payload);
      message.destinationName = topic;
      message.qos = 1;
      message.retained = retained;
      this.client.send(message);
      return { ok: true, payload };
    } catch (error) {
      return { ok: false, error: `Falha ao publicar: ${errorMessage(error)}` };
    }
  }

  private openClient(url: string, attempt: number): void {
    this.teardownClient();

    const clientId = `iotcontrol-${Math.random().toString(16).slice(2, 10)}`;
    let client: Paho.Client;
    try {
      client = new Paho.Client(url, clientId);
    } catch (error) {
      this.setSnapshot({ status: 'error', brokerUrl: url, error: errorMessage(error), reconnectAttempt: 0 });
      return;
    }
    this.client = client;
    this.setSnapshot({ status: 'connecting', brokerUrl: url, error: attempt > 0 ? this.snapshot.error : null, reconnectAttempt: attempt });

    // Callbacks ignoram eventos de clientes antigos (ex.: após trocar de broker).
    client.onConnectionLost = (response) => {
      if (this.client !== client) return;
      if (response.errorCode === 0) {
        this.setSnapshot({ status: 'disconnected', error: null, reconnectAttempt: 0 });
        return;
      }
      this.scheduleReconnect(url, 1, `Conexão perdida: ${describeError(response)}`);
    };

    client.onMessageArrived = (message) => {
      if (this.client !== client) return;
      let payload: string;
      try {
        payload = message.payloadString;
      } catch {
        payload = '<payload binário>';
      }
      const incoming: MqttIncomingMessage = {
        topic: message.destinationName,
        payload,
        retained: message.retained,
        receivedAt: Date.now(),
      };
      this.messageListeners.forEach((listener) => listener(incoming));
    };

    try {
      client.connect({
        timeout: MQTT_OPTIONS.connectTimeoutSeconds,
        keepAliveInterval: MQTT_OPTIONS.keepAliveSeconds,
        cleanSession: true,
        reconnect: false, // a reconexão é controlada por este serviço
        onSuccess: () => {
          if (this.client !== client) return;
          this.topics.forEach((topic) => this.subscribeOnClient(topic));
          this.setSnapshot({ status: 'connected', error: null, reconnectAttempt: 0 });
        },
        onFailure: (error) => {
          if (this.client !== client) return;
          const reason = describeError(error);
          if (attempt > 0) {
            this.scheduleReconnect(url, attempt + 1, reason);
          } else {
            this.setSnapshot({ status: 'error', error: reason, reconnectAttempt: 0 });
          }
        },
      });
    } catch (error) {
      this.setSnapshot({ status: 'error', error: errorMessage(error), reconnectAttempt: 0 });
    }
  }

  private scheduleReconnect(url: string, attempt: number, reason: string): void {
    this.clearReconnectTimer();
    if (attempt > MQTT_OPTIONS.maxReconnectAttempts) {
      this.teardownClient();
      this.setSnapshot({
        status: 'error',
        error: `${reason} Reconexão automática esgotada após ${MQTT_OPTIONS.maxReconnectAttempts} tentativas.`,
        reconnectAttempt: 0,
      });
      return;
    }
    const delay = Math.min(
      MQTT_OPTIONS.reconnectBaseDelayMs * 2 ** (attempt - 1),
      MQTT_OPTIONS.reconnectMaxDelayMs,
    );
    this.setSnapshot({ status: 'connecting', error: reason, reconnectAttempt: attempt });
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openClient(url, attempt);
    }, delay);
  }

  private subscribeOnClient(topic: string): void {
    try {
      this.client?.subscribe(topic, { qos: 1 });
    } catch (error) {
      this.setSnapshot({ error: `Falha ao inscrever em ${topic}: ${errorMessage(error)}` });
    }
  }

  /** Remove callbacks e encerra o cliente atual, se existir. */
  private teardownClient(): void {
    const client = this.client;
    this.client = null;
    if (!client) return;
    client.onConnectionLost = () => undefined;
    client.onMessageArrived = () => undefined;
    try {
      if (client.isConnected()) client.disconnect();
    } catch {
      // O cliente já estava desconectado.
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setSnapshot(partial: Partial<ConnectionSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    this.statusListeners.forEach((listener) => listener(this.snapshot));
  }
}

/** Instância única compartilhada pelo app. */
export const mqttService = new MqttService();
