import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { Screen } from '../components/Screen';
import { SectionTitle } from '../components/SectionTitle';
import { BROKER_PRESETS, TOPICS } from '../config/mqttConfig';
import { useMqtt } from '../contexts/MqttContext';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeMode } from '../themes/colors';
import { parseBrokerUrl } from '../utils/validators';

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
];

export function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const { connection, brokerUrl, autoConnect, connect, disconnect, setAutoConnect } = useMqtt();
  const [urlInput, setUrlInput] = useState(brokerUrl);

  const handleConnect = () => {
    const savedUrl = connect(urlInput);
    // Exibe a URL normalizada (ex.: porta/caminho padrão adicionados).
    if (savedUrl) setUrlInput(savedUrl);
  };

  const validation = parseBrokerUrl(urlInput);
  const isBusy = connection.status === 'connecting';
  const isConnected = connection.status === 'connected';

  return (
    <Screen>
      <SectionTitle>Broker MQTT (WebSocket)</SectionTitle>
      <Card style={styles.gap}>
        <Text style={[styles.label, { color: colors.text }]}>URL do broker</Text>
        <TextInput
          value={urlInput}
          onChangeText={setUrlInput}
          placeholder="wss://broker.hivemq.com:8884/mqtt"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          inputMode="url"
          returnKeyType="go"
          onSubmitEditing={handleConnect}
          accessibilityLabel="URL WebSocket do broker"
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.surfaceAlt,
              borderColor: validation.ok ? colors.border : colors.danger,
            },
          ]}
        />
        <Text style={[styles.help, { color: validation.ok ? colors.textMuted : colors.danger }]}>
          {validation.ok
            ? 'Use ws:// ou wss:// com a porta WebSocket do broker (não a porta TCP 1883).'
            : validation.error}
        </Text>

        <View style={styles.presets}>
          {BROKER_PRESETS.map((preset) => (
            <Pressable
              key={preset.url}
              onPress={() => setUrlInput(preset.url)}
              accessibilityRole="button"
              accessibilityLabel={`Usar ${preset.label}`}
              style={[
                styles.chip,
                {
                  borderColor: urlInput === preset.url ? colors.primary : colors.border,
                  backgroundColor: urlInput === preset.url ? colors.surfaceAlt : 'transparent',
                },
              ]}
            >
              <Text style={[styles.chipText, { color: colors.text }]}>{preset.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.buttons}>
          <AppButton
            label={isConnected && urlInput.trim() === brokerUrl ? 'Reconectar' : 'Salvar e conectar'}
            icon="link"
            onPress={handleConnect}
            loading={isBusy}
            disabled={!validation.ok}
            style={styles.flex}
          />
          <AppButton
            label="Desconectar"
            icon="close-circle-outline"
            variant="danger"
            onPress={disconnect}
            disabled={connection.status === 'disconnected'}
            style={styles.flex}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.flex}>
            <Text style={[styles.label, { color: colors.text }]}>Conectar ao abrir o app</Text>
            <Text style={[styles.help, { color: colors.textMuted }]}>Usa a URL salva acima.</Text>
          </View>
          <Switch
            value={autoConnect}
            onValueChange={setAutoConnect}
            accessibilityLabel="Conectar automaticamente ao abrir o app"
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
      </Card>

      <ConnectionStatus showReconnect={false} />

      <SectionTitle>Aparência</SectionTitle>
      <Card style={styles.gap}>
        <Text style={[styles.label, { color: colors.text }]}>Tema</Text>
        <View style={[styles.segmented, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          {THEME_OPTIONS.map((option) => {
            const selected = option.mode === mode;
            return (
              <Pressable
                key={option.mode}
                onPress={() => setMode(option.mode)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`Tema ${option.label}`}
                style={[styles.segment, selected && { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.segmentText, { color: selected ? colors.onPrimary : colors.text }]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.help, { color: colors.textMuted }]}>A preferência fica salva no dispositivo.</Text>
      </Card>

      <SectionTitle>Tópicos</SectionTitle>
      <Card style={styles.gap}>
        <TopicRow label="Temperatura (subscribe)" topic={TOPICS.temperature} />
        <TopicRow label="Umidade (subscribe)" topic={TOPICS.humidity} />
        <TopicRow label="Estado da lâmpada (subscribe)" topic={TOPICS.lampState} />
        <TopicRow label="Comando da lâmpada (publish)" topic={TOPICS.lampCommand} />
      </Card>
    </Screen>
  );
}

interface TopicRowProps {
  label: string;
  topic: string;
}

function TopicRow({ label, topic }: TopicRowProps) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[styles.topicLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.topic, { color: colors.text }]} selectable>
        {topic}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gap: {
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  help: {
    fontSize: 12,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 9,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
  },
  topicLabel: {
    fontSize: 12,
  },
  topic: {
    fontFamily: 'monospace',
    fontSize: 13,
  },
});
