export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  lampOn: string;
  lampOff: string;
  sent: string;
  received: string;
}

export const lightColors: ThemeColors = {
  background: '#F3F5F9',
  surface: '#FFFFFF',
  surfaceAlt: '#E9EDF4',
  border: '#D5DBE5',
  text: '#16202E',
  textMuted: '#5D6B7E',
  primary: '#2563EB',
  onPrimary: '#FFFFFF',
  success: '#15803D',
  warning: '#B45309',
  danger: '#DC2626',
  info: '#0369A1',
  lampOn: '#F59E0B',
  lampOff: '#94A3B8',
  sent: '#7C3AED',
  received: '#0E7490',
};

export const darkColors: ThemeColors = {
  background: '#0B1220',
  surface: '#152033',
  surfaceAlt: '#1E2B42',
  border: '#2A3953',
  text: '#E8EDF5',
  textMuted: '#93A1B8',
  primary: '#60A5FA',
  onPrimary: '#0B1220',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#38BDF8',
  lampOn: '#FCD34D',
  lampOff: '#64748B',
  sent: '#A78BFA',
  received: '#22D3EE',
};

export const themes: Record<ThemeMode, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};
