import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMqtt, type NoticeType } from '../contexts/MqttContext';
import { useTheme } from '../contexts/ThemeContext';

const AUTO_DISMISS_MS = 4000;
/** Altura aproximada da barra de abas, para o aviso ficar logo acima dela. */
const TAB_BAR_OFFSET = 64;

const ICONS: Record<NoticeType, ComponentProps<typeof Ionicons>['name']> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  warning: 'warning',
  info: 'information-circle',
};

/** Aviso flutuante único (renderizado no layout raiz) para feedback de conexão, comandos e erros. */
export function NoticeBanner() {
  const { colors } = useTheme();
  const { notice, dismissNotice } = useMqtt();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(dismissNotice, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [notice, dismissNotice]);

  if (!notice) return null;

  const tone: Record<NoticeType, string> = {
    success: colors.success,
    error: colors.danger,
    warning: colors.warning,
    info: colors.info,
  };

  return (
    <Pressable
      onPress={dismissNotice}
      accessibilityRole="alert"
      accessibilityLabel={notice.message}
      accessibilityHint="Toque para fechar"
      style={[
        styles.banner,
        { backgroundColor: colors.surface, borderColor: tone[notice.type], bottom: insets.bottom + TAB_BAR_OFFSET },
      ]}
    >
      <Ionicons name={ICONS[notice.type]} size={20} color={tone[notice.type]} />
      <Text style={[styles.text, { color: colors.text }]}>{notice.message}</Text>
      <Ionicons name="close" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderLeftWidth: 5,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  text: {
    flex: 1,
    fontSize: 14,
  },
});
