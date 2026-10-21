import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_BROKER_URL } from '../config/mqttConfig';
import type { ThemeMode } from '../themes/colors';

const KEYS = {
  brokerUrl: '@iotcontrol:brokerUrl',
  theme: '@iotcontrol:theme',
  autoConnect: '@iotcontrol:autoConnect',
} as const;

export interface Preferences {
  brokerUrl: string;
  /** null quando o usuário ainda não escolheu (segue o tema do sistema). */
  theme: ThemeMode | null;
  autoConnect: boolean;
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

export async function loadPreferences(): Promise<Preferences> {
  try {
    const entries = await AsyncStorage.multiGet([KEYS.brokerUrl, KEYS.theme, KEYS.autoConnect]);
    const values = new Map(entries);
    const theme = values.get(KEYS.theme) ?? null;
    return {
      brokerUrl: values.get(KEYS.brokerUrl) || DEFAULT_BROKER_URL,
      theme: isThemeMode(theme) ? theme : null,
      autoConnect: values.get(KEYS.autoConnect) !== 'false',
    };
  } catch {
    return { brokerUrl: DEFAULT_BROKER_URL, theme: null, autoConnect: true };
  }
}

export async function saveBrokerUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.brokerUrl, url);
}

export async function saveTheme(theme: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(KEYS.theme, theme);
}

export async function saveAutoConnect(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.autoConnect, String(enabled));
}
