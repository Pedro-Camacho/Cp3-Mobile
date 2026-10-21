import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';

type IconName = ComponentProps<typeof Ionicons>['name'];
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  /** Aparência esmaecida sem bloquear o toque (para exibir feedback). */
  dimmed?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  dimmed = false,
  style,
  accessibilityHint,
}: AppButtonProps) {
  const { colors } = useTheme();

  const palette: Record<ButtonVariant, { background: string; text: string; border: string }> = {
    primary: { background: colors.primary, text: colors.onPrimary, border: colors.primary },
    secondary: { background: colors.surfaceAlt, text: colors.text, border: colors.border },
    danger: { background: colors.danger, text: colors.onPrimary, border: colors.danger },
    ghost: { background: 'transparent', text: colors.primary, border: colors.border },
  };
  const { background, text, border } = palette[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, borderColor: border },
        (inactive || dimmed) && styles.inactive,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={text} />
        ) : (
          icon && <Ionicons name={icon} size={18} color={text} />
        )}
        <Text style={[styles.label, { color: text }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  inactive: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
