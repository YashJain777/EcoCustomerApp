import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { spacing, useTheme } from '@theme/index';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onPress?: () => void;
  activeOpacity?: number;
}

const PADDING_MAP = {
  none: 0,
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
};

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
  padding = 'md',
  onPress,
  activeOpacity = 0.7,
}) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => makeStyles(theme.colors), [theme.colors]);

  const paddingValue = PADDING_MAP[padding];

  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    variant === 'flat' && styles.flat,
    { padding: paddingValue },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={activeOpacity}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const makeStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: 16,
  },
  elevated: {
    borderWidth: 1,
    borderColor: colors.border.light,
    elevation: 2,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  flat: {
    backgroundColor: colors.background.default,
  },
});
