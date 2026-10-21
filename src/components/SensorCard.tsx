import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';
import type { SensorReading } from '../types/mqtt';
import { formatNumber, formatTime } from '../utils/format';
import { Card } from './Card';

interface SensorCardProps {
  title: string;
  unit: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  accentColor: string;
  reading: SensorReading | null;
  fractionDigits?: number;
}

export function SensorCard({ title, unit, icon, accentColor, reading, fractionDigits = 1 }: SensorCardProps) {
  const { colors } = useTheme();
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={icon} size={20} color={accentColor} />
        <Text style={[styles.title, { color: colors.textMuted }]}>{title}</Text>
      </View>
      {reading ? (
        <>
          <Text
            style={[styles.value, { color: colors.text }]}
            accessibilityLabel={`${title}: ${formatNumber(reading.value, fractionDigits)} ${unit}`}
          >
            {formatNumber(reading.value, fractionDigits)}
            <Text style={[styles.unit, { color: colors.textMuted }]}> {unit}</Text>
          </Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>Atualizado às {formatTime(reading.updatedAt)}</Text>
        </>
      ) : (
        <>
          <Text style={[styles.value, { color: colors.textMuted }]}>--</Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>Aguardando dados…</Text>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    fontSize: 34,
    fontWeight: '700',
    marginTop: 8,
  },
  unit: {
    fontSize: 18,
    fontWeight: '500',
  },
  time: {
    fontSize: 12,
    marginTop: 4,
  },
});
