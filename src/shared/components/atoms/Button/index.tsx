import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { AppText } from '../AppText';
import { spacing, useTheme } from '@theme/index';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'cta' | 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'cta',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const getBackgroundColor = () => {
    if (disabled) return colors.neutral[300];
    switch (variant) {
      case 'cta': return colors.cta.main;
      case 'primary': return colors.primary.main;
      case 'secondary': return colors.secondary.main;
      case 'danger': return colors.status.danger;
      case 'outline': return 'transparent';
      default: return colors.cta.main;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.neutral[500];
    if (variant === 'outline') return colors.cta.main;
    return colors.text.inverse;
  };

  const getPaddingVertical = () => {
    switch (size) {
      case 'small': return spacing.xs + 2;
      case 'large': return spacing.md;
      default: return spacing.sm + 4;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          paddingVertical: getPaddingVertical(),
          borderColor: variant === 'outline' ? colors.cta.main : 'transparent',
          borderWidth: variant === 'outline' ? 1.5 : 0,
        },
        variant === 'cta' && !disabled ? styles.ctaShadow : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <AppText style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</AppText>
      )}
    </TouchableOpacity>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  ctaShadow: {
    elevation: 3,
    shadowColor: colors.cta.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

