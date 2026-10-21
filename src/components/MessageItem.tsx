import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TOPIC_BASE } from '../config/mqttConfig';
import { useTheme } from '../contexts/ThemeContext';
import type { HistoryEntry } from '../types/mqtt';
import { formatTime } from '../utils/format';

interface MessageItemProps {
  message: HistoryEntry;
}

function MessageItemComponent({ message }: MessageItemProps) {
  const { colors } = useTheme();
  const sent = message.direction === 'sent';
  const accent = sent ? colors.sent : colors.received;
  const shortTopic = message.topic.startsWith(`${TOPIC_BASE}/`)
    ? message.topic.slice(TOPIC_BASE.length + 1)
    : message.topic;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: accent }]}
      accessibilityLabel={`Mensagem ${sent ? 'enviada' : 'recebida'} em ${message.topic} às ${formatTime(message.timestamp)}: ${message.payload}`}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: accent }]}>
          <Ionicons name={sent ? 'arrow-up' : 'arrow-down'} size={12} color={colors.background} />
          <Text style={[styles.badgeText, { color: colors.background }]}>{sent ? 'ENVIADA' : 'RECEBIDA'}</Text>
        </View>
        {message.retained ? (
          <Text style={[styles.tag, { color: colors.textMuted, borderColor: colors.border }]}>retida</Text>
        ) : null}
        <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(message.timestamp)}</Text>
      </View>
      <Text style={[styles.topic, { color: colors.text }]} numberOfLines={1}>
        {shortTopic}
      </Text>
      <Text style={[styles.fullTopic, { color: colors.textMuted }]} numberOfLines={1}>
        {message.topic}
      </Text>
      <Text style={[styles.payload, { color: colors.text, backgroundColor: colors.surfaceAlt }]}>{message.payload}</Text>
      {!message.valid ? (
        <View style={styles.invalid}>
          <Ionicons name="warning" size={14} color={colors.danger} />
          <Text style={[styles.invalidText, { color: colors.danger }]}>Ignorada: {message.note ?? 'payload inválido'}</Text>
        </View>
      ) : null}
    </View>
  );
}

export const MessageItem = memo(MessageItemComponent);

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tag: {
    fontSize: 11,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
  },
  time: {
    marginLeft: 'auto',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  topic: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  fullTopic: {
    fontSize: 11,
    marginTop: 1,
  },
  payload: {
    fontFamily: 'monospace',
    fontSize: 13,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  invalid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  invalidText: {
    fontSize: 12,
    flex: 1,
  },
});
