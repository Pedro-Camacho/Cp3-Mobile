import type { LampState, LampStatePayload, SensorPayload, ValidationResult } from '../types/mqtt';

interface Range {
  min: number;
  max: number;
}

export const TEMPERATURE_RANGE: Range = { min: -40, max: 85 };
export const HUMIDITY_RANGE: Range = { min: 0, max: 100 };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJson(raw: string): ValidationResult<unknown> {
  try {
    return { ok: true, data: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, error: 'Payload não é um JSON válido' };
  }
}

/**
 * Valida payloads de sensor no formato {"value": number}.
 * Também aceita um número puro ("24.5") para facilitar testes manuais.
 */
export function parseSensorPayload(raw: string, range: Range): ValidationResult<SensorPayload> {
  const parsed = parseJson(raw.trim());
  if (!parsed.ok) return parsed;

  let value: unknown;
  if (typeof parsed.data === 'number') {
    value = parsed.data;
  } else if (isRecord(parsed.data)) {
    value = parsed.data.value;
  } else {
    return { ok: false, error: 'Formato esperado: {"value": número}' };
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { ok: false, error: 'Campo "value" ausente ou não numérico' };
  }
  if (value < range.min || value > range.max) {
    return { ok: false, error: `Valor fora da faixa (${range.min} a ${range.max})` };
  }
  return { ok: true, data: { value } };
}

function isLampState(value: unknown): value is LampState {
  return value === 'ON' || value === 'OFF';
}

/** Valida payloads de estado da lâmpada no formato {"state": "ON" | "OFF"}. */
export function parseLampStatePayload(raw: string): ValidationResult<LampStatePayload> {
  const parsed = parseJson(raw.trim());
  if (!parsed.ok) return parsed;
  if (!isRecord(parsed.data)) {
    return { ok: false, error: 'Formato esperado: {"state": "ON" | "OFF"}' };
  }
  const state = typeof parsed.data.state === 'string' ? parsed.data.state.toUpperCase() : parsed.data.state;
  if (!isLampState(state)) {
    return { ok: false, error: 'Campo "state" deve ser "ON" ou "OFF"' };
  }
  return { ok: true, data: { state } };
}

export interface BrokerUrlParts {
  url: string;
  protocol: 'ws' | 'wss';
  host: string;
  port: number;
}

/**
 * Valida a URL WebSocket do broker. Rejeita URLs mqtt:// e a porta TCP 1883,
 * que são uma confusão comum (o app só fala MQTT sobre WebSocket).
 */
export function parseBrokerUrl(input: string): ValidationResult<BrokerUrlParts> {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: 'Informe a URL do broker' };
  }
  const match = /^(wss?):\/\/([^/:\s]+)(?::(\d{1,5}))?(\/\S*)?$/i.exec(trimmed);
  if (!match) {
    if (/^(mqtts?|tcp):\/\//i.test(trimmed)) {
      return { ok: false, error: 'Use ws:// ou wss:// — o app conecta via WebSocket, não TCP' };
    }
    return { ok: false, error: 'URL inválida. Exemplo: wss://broker.hivemq.com:8884/mqtt' };
  }
  const protocol = match[1].toLowerCase() as 'ws' | 'wss';
  const host = match[2];
  const port = match[3] ? Number(match[3]) : protocol === 'wss' ? 443 : 80;
  // Paho exige um caminho; brokers costumam usar /mqtt.
  const path = match[4] ?? '/mqtt';

  if (port < 1 || port > 65535) {
    return { ok: false, error: 'Porta inválida' };
  }
  if (port === 1883 || port === 8883) {
    return { ok: false, error: `A porta ${port} é MQTT TCP. Use a porta WebSocket do broker (ex.: 8884)` };
  }
  return { ok: true, data: { url: `${protocol}://${host}:${port}${path}`, protocol, host, port } };
}
