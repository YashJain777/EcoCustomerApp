import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppIcon } from '../../atoms/Icon';
import { AppText } from '../../atoms/AppText';
import { spacing, radius, shadows, useTheme } from '@theme/index';

export interface QuickGridCardProps {
  iconName: string;
  label: string;
  badgeCount?: number;
  iconColor?: string;
  bgColor?: string;
  onPress: () => void;
}

export const QuickGridCard: React.FC<QuickGridCardProps> = ({
  iconName,
  label,
  badgeCount,
  iconColor,
  bgColor,
  onPress,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const resolvedIconColor = iconColor || colors.primary.main;
  const resolvedBgColor = bgColor || colors.primary.light;
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: resolvedBgColor }]}>
        <AppIcon name={iconName} size="md" color={resolvedIconColor} />
        {badgeCount !== undefined && badgeCount > 0 && (
          <View style={styles.badge}>
            <AppText style={styles.badgeText}>{badgeCount}</AppText>
          </View>
        )}
      </View>
      <AppText style={styles.label} numberOfLines={2}>
        {label}
      </AppText>
    </TouchableOpacity>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    width: '23%',
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.status.danger,
    borderRadius: radius.pill,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.text.inverse,
    fontSize: 9,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
});
