/**
 * Identificador exclusivo do grupo. Todos os tópicos começam com este prefixo
 * para evitar interferência com outros projetos que usam o mesmo broker público.
 * Se alterar aqui, use o mesmo valor no simulador (variável MQTT_TOPIC_BASE).
 */
export const TOPIC_BASE = 'fiap/cp3/iotcontrol-grupo01';

export const TOPICS = {
  temperature: `${TOPIC_BASE}/sensor/temperatura`,
  humidity: `${TOPIC_BASE}/sensor/umidade`,
  lampCommand: `${TOPIC_BASE}/lampada/comando`,
  lampState: `${TOPIC_BASE}/lampada/estado`,
} as const;

/** Tópicos em que o aplicativo se inscreve. */
export const SUBSCRIBED_TOPICS: readonly string[] = [
  TOPICS.temperature,
  TOPICS.humidity,
  TOPICS.lampState,
];

/**
 * Broker público da HiveMQ via WebSocket seguro (WSS, porta 8884, caminho /mqtt).
 * Atenção: 1883 é a porta MQTT TCP e NÃO funciona no app — o app precisa de WebSocket.
 */
export const DEFAULT_BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt';

/** Exemplos de brokers públicos com WebSocket exibidos na tela de Configurações. */
export const BROKER_PRESETS: readonly { label: string; url: string }[] = [
  { label: 'HiveMQ (WSS)', url: 'wss://broker.hivemq.com:8884/mqtt' },
  { label: 'EMQX (WSS)', url: 'wss://broker.emqx.io:8084/mqtt' },
  { label: 'Mosquitto (WSS)', url: 'wss://test.mosquitto.org:8081/mqtt' },
];

export const MQTT_OPTIONS = {
  /** Tempo máximo (s) para estabelecer a conexão. */
  connectTimeoutSeconds: 10,
  keepAliveSeconds: 30,
  /** Reconexão automática após queda inesperada. */
  maxReconnectAttempts: 5,
  reconnectBaseDelayMs: 1000,
  reconnectMaxDelayMs: 15000,
  /** Tempo de espera pela confirmação de estado após um comando. */
  commandAckTimeoutMs: 5000,
} as const;

/** Quantidade de mensagens mantidas no histórico. */
export const HISTORY_LIMIT = 10;
