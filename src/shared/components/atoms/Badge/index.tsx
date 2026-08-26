import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { AppText } from '../AppText';
import { spacing, useTheme } from '@theme/index';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'info', style, textStyle }) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.status.successBg, text: colors.status.success };
      case 'warning':
        return { bg: colors.status.warningBg, text: colors.status.warning };
      case 'danger':
        return { bg: colors.status.dangerBg, text: colors.status.danger };
      case 'primary':
        return { bg: colors.primary.light, text: colors.primary.main };
      case 'neutral':
        return { bg: colors.status.neutralBg, text: colors.status.neutral };
      case 'info':
      default:
        return { bg: colors.status.infoBg, text: colors.status.info };
    }
  };

  const currentColors = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: currentColors.bg }, style]}>
      <AppText style={[styles.text, { color: currentColors.text }, textStyle]}>{label}</AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

