import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { saveTheme } from '../services/storageService';
import { themes, type ThemeColors, type ThemeMode } from '../themes/colors';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  initialMode: ThemeMode;
  children: ReactNode;
}

export function ThemeProvider({ initialMode, children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    saveTheme(next).catch(() => {
      // Falha ao persistir não impede a troca de tema na sessão atual.
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, colors: themes[mode], isDark: mode === 'dark', setMode, toggleTheme }),
    [mode, setMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
}
