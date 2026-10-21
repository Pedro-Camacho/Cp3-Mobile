import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useMqtt } from '../contexts/MqttContext';
import { useTheme } from '../contexts/ThemeContext';
import type { ConnectionStatus as Status } from '../types/mqtt';
import { AppButton } from './AppButton';
import { Card } from './Card';

const LABELS: Record<Status, string> = {
  connecting: 'Conectando',
  connected: 'Conectado',
  disconnected: 'Desconectado',
  error: 'Erro',
};

interface ConnectionStatusProps {
  /** Exibe o botão de reconectar quando houver erro ou desconexão. */
  showReconnect?: boolean;
}

export function ConnectionStatus({ showReconnect = true }: ConnectionStatusProps) {
  const { colors } = useTheme();
  const { connection, brokerUrl, reconnect } = useMqtt();
  const { status, error, reconnectAttempt } = connection;

  const statusColor: Record<Status, string> = {
    connecting: colors.warning,
    connected: colors.success,
    disconnected: colors.textMuted,
    error: colors.danger,
  };

  const label =
    status === 'connecting' && reconnectAttempt > 0
      ? `Reconectando (tentativa ${reconnectAttempt})`
      : LABELS[status];

  return (
    <Card>
      <View style={styles.row} accessibilityRole="summary" accessibilityLabel={`Status da conexão: ${label}`}>
        {status === 'connecting' ? (
          <ActivityIndicator size="small" color={statusColor[status]} />
        ) : (
          <View style={[styles.dot, { backgroundColor: statusColor[status] }]} />
        )}
        <View style={styles.texts}>
          <Text style={[styles.status, { color: statusColor[status] }]}>{label}</Text>
          <Text style={[styles.url, { color: colors.textMuted }]} numberOfLines={1}>
            {connection.brokerUrl ?? brokerUrl}
          </Text>
        </View>
      </View>
      {error && status !== 'connected' ? (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      ) : null}
      {showReconnect && (status === 'error' || status === 'disconnected') ? (
        <AppButton
          label={status === 'error' ? 'Tentar novamente' : 'Conectar'}
          icon="refresh"
          variant="secondary"
          onPress={reconnect}
          style={styles.button}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  texts: {
    flex: 1,
  },
  status: {
    fontSize: 17,
    fontWeight: '700',
  },
  url: {
    fontSize: 13,
    marginTop: 2,
  },
  error: {
    marginTop: 10,
    fontSize: 13,
  },
  button: {
    marginTop: 12,
  },
});
