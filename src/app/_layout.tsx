import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NoticeBanner } from '../components/NoticeBanner';
import { MqttProvider } from '../contexts/MqttContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { loadPreferences, type Preferences } from '../services/storageService';

type IconName = ComponentProps<typeof Ionicons>['name'];

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const [preferences, setPreferences] = useState<Preferences | null>(null);

  useEffect(() => {
    let active = true;
    loadPreferences().then((loaded) => {
      if (active) setPreferences(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!preferences) {
    const dark = systemScheme === 'dark';
    return (
      <View style={[styles.loading, { backgroundColor: dark ? '#0B1220' : '#F3F5F9' }]}>
        <ActivityIndicator size="large" color={dark ? '#60A5FA' : '#2563EB'} />
        <Text style={{ color: dark ? '#E8EDF5' : '#16202E' }}>Carregando preferências…</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode={preferences.theme ?? (systemScheme === 'dark' ? 'dark' : 'light')}>
        <MqttProvider initialBrokerUrl={preferences.brokerUrl} initialAutoConnect={preferences.autoConnect}>
          <ThemedTabs />
        </MqttProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedTabs() {
  const { colors, isDark } = useTheme();
  // Aplica as cores do app também aos elementos da navegação (cabeçalho, bordas).
  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [colors, isDark]);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'IoT Control',
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ focused, size }) => <TabIcon name="speedometer-outline" focused={focused} size={size} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Histórico',
            tabBarIcon: ({ focused, size }) => <TabIcon name="list-outline" focused={focused} size={size} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Configurações',
            tabBarIcon: ({ focused, size }) => <TabIcon name="settings-outline" focused={focused} size={size} />,
          }}
        />
      </Tabs>
      <NoticeBanner />
    </NavigationThemeProvider>
  );
}

interface TabIconProps {
  name: IconName;
  focused: boolean;
  size: number;
}

function TabIcon({ name, focused, size }: TabIconProps) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={focused ? colors.primary : colors.textMuted} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
});
