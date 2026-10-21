/** Estados possíveis da conexão com o broker. */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/** Direção de uma mensagem do ponto de vista do aplicativo. */
export type MessageDirection = 'sent' | 'received';

/** Estado da lâmpada virtual (também usado como ação do comando). */
export type LampState = 'ON' | 'OFF';

/** Payload publicado pelo simulador nos tópicos de sensores: {"value":24.5} */
export interface SensorPayload {
  value: number;
}

/** Payload publicado pelo simulador no tópico de estado: {"state":"ON"} */
export interface LampStatePayload {
  state: LampState;
}

/** Payload publicado pelo app no tópico de comando: {"action":"ON"} */
export interface LampCommandPayload {
  action: LampState;
}

/** Última leitura válida de um sensor. */
export interface SensorReading {
  value: number;
  updatedAt: number;
}

/** Último estado da lâmpada confirmado pelo dispositivo. */
export interface LampReading {
  state: LampState;
  updatedAt: number;
}

/** Mensagem bruta entregue pelo serviço MQTT para a camada de interface. */
export interface MqttIncomingMessage {
  topic: string;
  payload: string;
  retained: boolean;
  receivedAt: number;
}

/** Item do histórico exibido na tela de Histórico. */
export interface HistoryEntry {
  id: string;
  topic: string;
  payload: string;
  direction: MessageDirection;
  timestamp: number;
  /** false quando o payload recebido não passou na validação. */
  valid: boolean;
  /** Mensagem retida pelo broker (entregue logo após a inscrição). */
  retained?: boolean;
  /** Motivo da rejeição, quando inválido. */
  note?: string;
}

/** Fotografia do estado da conexão emitida pelo serviço. */
export interface ConnectionSnapshot {
  status: ConnectionStatus;
  brokerUrl: string | null;
  error: string | null;
  /** Tentativa atual de reconexão automática (0 = nenhuma em andamento). */
  reconnectAttempt: number;
}

/** Resultado de validação com união discriminada (evita exceções e `any`). */
export type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Resultado de uma tentativa de publicação. */
export type PublishResult = { ok: true; payload: string } | { ok: false; error: string };
