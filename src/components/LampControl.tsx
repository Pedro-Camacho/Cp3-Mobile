import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';
import type { LampReading, LampState } from '../types/mqtt';
import { formatTime } from '../utils/format';
import { AppButton } from './AppButton';
import { Card } from './Card';

interface LampControlProps {
  /** Estado confirmado pelo dispositivo (tópico de estado). */
  lamp: LampReading | null;
  pendingCommand: LampState | null;
  connected: boolean;
  onCommand: (action: LampState) => void;
}

export function LampControl({ lamp, pendingCommand, connected, onCommand }: LampControlProps) {
  const { colors } = useTheme();
  const isOn = lamp?.state === 'ON';
  const stateLabel = lamp ? (isOn ? 'Ligada' : 'Desligada') : 'Desconhecido';

  return (
    <Card>
      <View style={styles.row}>
        <View
          style={[
            styles.bulb,
            { backgroundColor: isOn ? colors.lampOn : colors.surfaceAlt, borderColor: isOn ? colors.lampOn : colors.border },
          ]}
        >
          <Ionicons name={isOn ? 'bulb' : 'bulb-outline'} size={34} color={isOn ? '#3B2A00' : colors.lampOff} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.textMuted }]}>Lâmpada</Text>
          <Text style={[styles.state, { color: isOn ? colors.lampOn : colors.text }]} accessibilityLiveRegion="polite">
            {stateLabel}
          </Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {lamp ? `Confirmado às ${formatTime(lamp.updatedAt)}` : 'Aguardando estado do dispositivo…'}
          </Text>
        </View>
      </View>

      {pendingCommand ? (
        <View style={[styles.pending, { backgroundColor: colors.surfaceAlt }]}>
          <ActivityIndicator size="small" color={colors.warning} />
          <Text style={[styles.pendingText, { color: colors.text }]}>
            Aguardando confirmação do comando {pendingCommand === 'ON' ? 'Ligar' : 'Desligar'}…
          </Text>
        </View>
      ) : null}

      <View style={styles.buttons}>
        <AppButton
          label="Ligar"
          icon="flash"
          onPress={() => onCommand('ON')}
          dimmed={!connected}
          loading={pendingCommand === 'ON'}
          style={styles.button}
          accessibilityHint="Publica o comando ON no tópico da lâmpada"
        />
        <AppButton
          label="Desligar"
          icon="flash-off"
          variant="secondary"
          onPress={() => onCommand('OFF')}
          dimmed={!connected}
          loading={pendingCommand === 'OFF'}
          style={styles.button}
          accessibilityHint="Publica o comando OFF no tópico da lâmpada"
        />
      </View>
      {!connected ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>Conecte-se ao broker para controlar a lâmpada.</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bulb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  state: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    marginTop: 2,
  },
  pending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
  },
  pendingText: {
    flex: 1,
    fontSize: 13,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
  hint: {
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
});
