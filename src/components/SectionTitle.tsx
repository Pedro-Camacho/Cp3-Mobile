import { StyleSheet, Text } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';

interface SectionTitleProps {
  children: string;
}

export function SectionTitle({ children }: SectionTitleProps) {
  const { colors } = useTheme();
  return <Text style={[styles.title, { color: colors.textMuted }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 8,
  },
});
