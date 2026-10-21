import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { HISTORY_LIMIT, MQTT_OPTIONS, SUBSCRIBED_TOPICS, TOPICS } from '../config/mqttConfig';
import { mqttService } from '../services/mqttService';
import { saveAutoConnect, saveBrokerUrl } from '../services/storageService';
import type {
  ConnectionSnapshot,
  HistoryEntry,
  LampCommandPayload,
  LampReading,
  LampState,
  MqttIncomingMessage,
  SensorReading,
} from '../types/mqtt';
import {
  HUMIDITY_RANGE,
  TEMPERATURE_RANGE,
  parseBrokerUrl,
  parseLampStatePayload,
  parseSensorPayload,
} from '../utils/validators';

export type NoticeType = 'success' | 'error' | 'warning' | 'info';

export interface Notice {
  id: number;
  type: NoticeType;
  message: string;
}

interface MqttContextValue {
  connection: ConnectionSnapshot;
  brokerUrl: string;
  autoConnect: boolean;
  temperature: SensorReading | null;
  humidity: SensorReading | null;
  lamp: LampReading | null;
  /** Comando enviado aguardando confirmação no tópico de estado. */
  pendingCommand: LampState | null;
  history: HistoryEntry[];
  notice: Notice | null;
  /** Valida, salva e conecta. Retorna a URL normalizada ou null se inválida. */
  connect: (url?: string) => string | null;
  disconnect: () => void;
  reconnect: () => void;
  setAutoConnect: (enabled: boolean) => void;
  sendLampCommand: (action: LampState) => void;
  clearHistory: () => void;
  dismissNotice: () => void;
}

const MqttContext = createContext<MqttContextValue | null>(null);

interface MqttProviderProps {
  initialBrokerUrl: string;
  initialAutoConnect: boolean;
  children: ReactNode;
}

let historySequence = 0;
let noticeSequence = 0;

export function MqttProvider({ initialBrokerUrl, initialAutoConnect, children }: MqttProviderProps) {
  const [connection, setConnection] = useState<ConnectionSnapshot>(() => mqttService.getSnapshot());
  const [brokerUrl, setBrokerUrl] = useState(initialBrokerUrl);
  const [autoConnect, setAutoConnectState] = useState(initialAutoConnect);
  const [temperature, setTemperature] = useState<SensorReading | null>(null);
  const [humidity, setHumidity] = useState<SensorReading | null>(null);
  const [lamp, setLamp] = useState<LampReading | null>(null);
  const [pendingCommand, setPendingCommand] = useState<LampState | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);

  const showNotice = useCallback((type: NoticeType, message: string) => {
    noticeSequence += 1;
    setNotice({ id: noticeSequence, type, message });
  }, []);

  const addHistory = useCallback((entry: Omit<HistoryEntry, 'id'>) => {
    historySequence += 1;
    const item: HistoryEntry = { ...entry, id: `${entry.timestamp}-${historySequence}` };
    setHistory((previous) => [item, ...previous].slice(0, HISTORY_LIMIT));
  }, []);

  // Status da conexão: um único listener (removido no cleanup) que também
  // gera avisos nas transições de estado.
  useEffect(() => {
    let previous = mqttService.getSnapshot().status;
    const unsubscribe = mqttService.onStatusChange((snapshot) => {
      setConnection(snapshot);
      if (snapshot.status === previous) return;
      const last = previous;
      previous = snapshot.status;
      if (snapshot.status === 'connected') {
        showNotice('success', 'Conectado ao broker');
      } else if (snapshot.status === 'error' && snapshot.error) {
        showNotice('error', snapshot.error);
      } else if (snapshot.status === 'disconnected' && last === 'connected') {
        setPendingCommand(null);
        showNotice('info', 'Desconectado do broker');
      }
    });
    return unsubscribe;
  }, [showNotice]);

  // Inscrição nos tópicos + listener de mensagens; ambos são cancelados no cleanup.
  useEffect(() => {
    const handleMessage = (message: MqttIncomingMessage) => {
      const base = {
        topic: message.topic,
        payload: message.payload,
        direction: 'received' as const,
        timestamp: message.receivedAt,
        retained: message.retained,
      };

      if (message.topic === TOPICS.temperature || message.topic === TOPICS.humidity) {
        const isTemperature = message.topic === TOPICS.temperature;
        const result = parseSensorPayload(message.payload, isTemperature ? TEMPERATURE_RANGE : HUMIDITY_RANGE);
        if (result.ok) {
          const reading: SensorReading = { value: result.data.value, updatedAt: message.receivedAt };
          (isTemperature ? setTemperature : setHumidity)(reading);
          addHistory({ ...base, valid: true });
        } else {
          addHistory({ ...base, valid: false, note: result.error });
        }
        return;
      }

      if (message.topic === TOPICS.lampState) {
        const result = parseLampStatePayload(message.payload);
        if (result.ok) {
          setLamp({ state: result.data.state, updatedAt: message.receivedAt });
          setPendingCommand((pending) => (pending === result.data.state ? null : pending));
          addHistory({ ...base, valid: true });
        } else {
          addHistory({ ...base, valid: false, note: result.error });
        }
        return;
      }

      addHistory({ ...base, valid: false, note: 'Tópico não reconhecido' });
    };

    const unsubscribeTopics = mqttService.subscribe(SUBSCRIBED_TOPICS);
    const unsubscribeMessages = mqttService.onMessage(handleMessage);
    return () => {
      unsubscribeMessages();
      unsubscribeTopics();
    };
  }, [addHistory]);

  // Conexão automática ao abrir o app (se habilitada) e desconexão ao desmontar.
  useEffect(() => {
    if (initialAutoConnect) {
      mqttService.connect(initialBrokerUrl);
    }
    return () => {
      mqttService.disconnect();
    };
  }, [initialAutoConnect, initialBrokerUrl]);

  // Timeout de confirmação: se o dispositivo não publicar o estado, avisa o usuário.
  useEffect(() => {
    if (!pendingCommand) return undefined;
    const timer = setTimeout(() => {
      setPendingCommand(null);
      showNotice('warning', 'O dispositivo não confirmou o comando. O simulador está em execução?');
    }, MQTT_OPTIONS.commandAckTimeoutMs);
    return () => clearTimeout(timer);
  }, [pendingCommand, showNotice]);

  const connect = useCallback(
    (url?: string): string | null => {
      const target = url ?? brokerUrl;
      const parsed = parseBrokerUrl(target);
      if (!parsed.ok) {
        showNotice('error', parsed.error);
        return null;
      }
      setBrokerUrl(parsed.data.url);
      saveBrokerUrl(parsed.data.url).catch(() => showNotice('warning', 'Não foi possível salvar a URL do broker'));
      mqttService.connect(parsed.data.url);
      return parsed.data.url;
    },
    [brokerUrl, showNotice],
  );

  const disconnect = useCallback(() => {
    mqttService.disconnect();
  }, []);

  const reconnect = useCallback(() => {
    mqttService.connect(brokerUrl);
  }, [brokerUrl]);

  const setAutoConnect = useCallback((enabled: boolean) => {
    setAutoConnectState(enabled);
    saveAutoConnect(enabled).catch(() => undefined);
  }, []);

  const sendLampCommand = useCallback(
    (action: LampState) => {
      if (!mqttService.isConnected()) {
        showNotice('error', 'Desconectado: o comando não foi enviado. Conecte-se ao broker primeiro.');
        return;
      }
      const command: LampCommandPayload = { action };
      const result = mqttService.publish(TOPICS.lampCommand, JSON.stringify(command));
      if (!result.ok) {
        showNotice('error', result.error);
        return;
      }
      addHistory({
        topic: TOPICS.lampCommand,
        payload: result.payload,
        direction: 'sent',
        timestamp: Date.now(),
        valid: true,
      });
      setPendingCommand(action);
      showNotice('info', `Comando ${action === 'ON' ? 'Ligar' : 'Desligar'} enviado. Aguardando confirmação…`);
    },
    [addHistory, showNotice],
  );

  const clearHistory = useCallback(() => setHistory([]), []);
  const dismissNotice = useCallback(() => setNotice(null), []);

  const value = useMemo<MqttContextValue>(
    () => ({
      connection,
      brokerUrl,
      autoConnect,
      temperature,
      humidity,
      lamp,
      pendingCommand,
      history,
      notice,
      connect,
      disconnect,
      reconnect,
      setAutoConnect,
      sendLampCommand,
      clearHistory,
      dismissNotice,
    }),
    [
      connection,
      brokerUrl,
      autoConnect,
      temperature,
      humidity,
      lamp,
      pendingCommand,
      history,
      notice,
      connect,
      disconnect,
      reconnect,
      setAutoConnect,
      sendLampCommand,
      clearHistory,
      dismissNotice,
    ],
  );

  return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
}

export function useMqtt(): MqttContextValue {
  const context = useContext(MqttContext);
  if (!context) {
    throw new Error('useMqtt deve ser usado dentro de MqttProvider');
  }
  return context;
}
