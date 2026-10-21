#!/usr/bin/env node
/**
 * Simulador do dispositivo IoT do projeto IoT Control.
 *
 * - Publica temperatura e umidade periodicamente (passeio aleatório realista).
 * - Inscreve-se no tópico de comando da lâmpada e, ao receber {"action":"ON"|"OFF"},
 *   publica o novo estado em {"state":"ON"|"OFF"} (mensagem retida).
 * - Aceita comandos digitados no terminal para testes manuais (digite "help").
 *
 * Uso:
 *   npm run simulator
 *   npm run simulator -- --interval 3 --broker wss://broker.emqx.io:8084/mqtt
 *   npm run simulator -- --manual          (não publica sensores automaticamente)
 *
 * Variáveis de ambiente (opcionais): MQTT_BROKER_URL, MQTT_TOPIC_BASE, MQTT_USERNAME, MQTT_PASSWORD.
 */
const readline = require('node:readline');
const mqtt = require('mqtt');

function readArg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);

const BROKER_URL = readArg('broker') || process.env.MQTT_BROKER_URL || 'wss://broker.hivemq.com:8884/mqtt';
// Deve ser igual a TOPIC_BASE em src/config/mqttConfig.ts
const TOPIC_BASE = readArg('base') || process.env.MQTT_TOPIC_BASE || 'fiap/cp3/iotcontrol-grupo01';
const INTERVAL_S = Number(readArg('interval') || 5);
const AUTO = !hasFlag('manual');
const COMMAND_DELAY_MS = Number(readArg('delay') || 400);

const TOPICS = {
  temperature: `${TOPIC_BASE}/sensor/temperatura`,
  humidity: `${TOPIC_BASE}/sensor/umidade`,
  lampCommand: `${TOPIC_BASE}/lampada/comando`,
  lampState: `${TOPIC_BASE}/lampada/estado`,
};

const state = {
  temperature: 24.5,
  humidity: 58,
  lamp: 'OFF',
};

const time = () => new Date().toLocaleTimeString('pt-BR');
const log = (icon, message) => console.log(`[${time()}] ${icon} ${message}`);

const client = mqtt.connect(BROKER_URL, {
  clientId: `iotcontrol-sim-${Math.random().toString(16).slice(2, 10)}`,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  clean: true,
  reconnectPeriod: 2000,
  connectTimeout: 10000,
});

function publish(topic, payload, retain = true) {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
  client.publish(topic, text, { qos: 1, retain }, (error) => {
    if (error) log('✖', `Falha ao publicar em ${topic}: ${error.message}`);
  });
  log('↑', `${topic}  ${text}`);
}

const round = (value, digits) => Number(value.toFixed(digits));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function publishTemperature(value) {
  state.temperature = round(value, 1);
  publish(TOPICS.temperature, { value: state.temperature });
}

function publishHumidity(value) {
  state.humidity = Math.round(value);
  publish(TOPICS.humidity, { value: state.humidity });
}

function publishLampState(lampState) {
  state.lamp = lampState;
  publish(TOPICS.lampState, { state: lampState });
}

function tick() {
  publishTemperature(clamp(state.temperature + (Math.random() - 0.5) * 0.8, 15, 35));
  publishHumidity(clamp(state.humidity + (Math.random() - 0.5) * 4, 30, 90));
}

let timer = null;
let firstConnect = true;

client.on('connect', () => {
  log('✔', `Conectado a ${BROKER_URL}`);
  client.subscribe(TOPICS.lampCommand, { qos: 1 }, (error) => {
    if (error) {
      log('✖', `Falha ao inscrever em ${TOPICS.lampCommand}: ${error.message}`);
      return;
    }
    log('👂', `Aguardando comandos em ${TOPICS.lampCommand}`);
  });

  if (firstConnect) {
    firstConnect = false;
    publishLampState(state.lamp);
    tick();
    if (AUTO) {
      timer = setInterval(tick, INTERVAL_S * 1000);
      log('⏱', `Publicando sensores a cada ${INTERVAL_S}s (use --manual para desativar)`);
    }
    printHelp();
  }
});

client.on('message', (topic, buffer) => {
  const raw = buffer.toString();
  log('↓', `${topic}  ${raw}`);
  if (topic !== TOPICS.lampCommand) return;

  let action;
  try {
    const parsed = JSON.parse(raw);
    action = typeof parsed?.action === 'string' ? parsed.action.toUpperCase() : undefined;
  } catch {
    action = undefined;
  }
  if (action !== 'ON' && action !== 'OFF') {
    log('⚠', 'Comando inválido ignorado. Esperado {"action":"ON"} ou {"action":"OFF"}');
    return;
  }
  // Pequeno atraso para simular o tempo de resposta do dispositivo.
  setTimeout(() => {
    publishLampState(action);
    log('💡', `Lâmpada ${action === 'ON' ? 'LIGADA' : 'DESLIGADA'}`);
  }, COMMAND_DELAY_MS);
});

client.on('reconnect', () => log('…', 'Reconectando ao broker'));
client.on('offline', () => log('✖', 'Broker inacessível (offline)'));
client.on('error', (error) => log('✖', `Erro: ${error.message}`));

function printHelp() {
  console.log(`
Comandos disponíveis no terminal:
  t <valor>     publica temperatura (ex.: t 27.3)
  h <valor>     publica umidade (ex.: h 61)
  on | off      força o estado da lâmpada (sem comando do app)
  tick          publica uma leitura aleatória de cada sensor
  invalid       publica payloads inválidos (testa a validação do app)
  pause|resume  pausa/retoma a publicação automática
  help          mostra esta ajuda
  quit          encerra o simulador
Tópicos:
  ${Object.values(TOPICS).join('\n  ')}
`);
}

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  const [command, arg] = line.trim().split(/\s+/);
  const value = Number(arg);
  switch ((command || '').toLowerCase()) {
    case 't':
      if (Number.isFinite(value)) publishTemperature(value);
      else log('⚠', 'Uso: t 25.4');
      break;
    case 'h':
      if (Number.isFinite(value)) publishHumidity(value);
      else log('⚠', 'Uso: h 60');
      break;
    case 'on':
    case 'off':
      publishLampState(command.toUpperCase());
      break;
    case 'tick':
      tick();
      break;
    case 'invalid':
      publish(TOPICS.temperature, 'abc', false);
      publish(TOPICS.humidity, { value: 'muito úmido' }, false);
      publish(TOPICS.lampState, { state: 'TALVEZ' }, false);
      break;
    case 'pause':
      clearInterval(timer);
      timer = null;
      log('⏸', 'Publicação automática pausada');
      break;
    case 'resume':
      if (!timer) timer = setInterval(tick, INTERVAL_S * 1000);
      log('▶', 'Publicação automática retomada');
      break;
    case 'help':
      printHelp();
      break;
    case 'quit':
    case 'exit':
      shutdown();
      break;
    case '':
      break;
    default:
      log('⚠', `Comando desconhecido: ${command} (digite help)`);
  }
});

function shutdown() {
  clearInterval(timer);
  rl.close();
  client.end(false, () => process.exit(0));
}

process.on('SIGINT', shutdown);
