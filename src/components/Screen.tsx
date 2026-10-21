import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';

interface ScreenProps {
  children: ReactNode;
  /** false quando a tela já possui sua própria lista rolável (ex.: FlatList). */
  scroll?: boolean;
}

export function Screen({ children, scroll = true }: ScreenProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={styles.fill}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 96,
    gap: 12,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
});
