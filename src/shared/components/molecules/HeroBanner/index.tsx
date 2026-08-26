import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { AppIcon } from '../../atoms/Icon';
import { AppText } from '../../atoms/AppText';
import { spacing, radius, shadows, useTheme } from '@theme/index';

export interface HeroBannerProps {
  title: string;
  subtitle?: string;
  badgeText?: string;
  iconName?: string;
  onPressAction?: () => void;
  actionText?: string;
  style?: StyleProp<ViewStyle>;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  title,
  subtitle,
  badgeText,
  iconName = 'sparkles-outline',
  onPressAction,
  actionText,
  style,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.banner, style]}>
      <View style={styles.contentGroup}>
        {badgeText && (
          <View style={styles.badgePill}>
            <AppIcon name={iconName} size="xs" color={colors.text.inverse} style={styles.badgeIcon} />
            <AppText style={styles.badgeText}>{badgeText}</AppText>
          </View>
        )}
        <AppText variant="headingXl" style={styles.title}>{title}</AppText>
        {subtitle && <AppText variant="bodySm" style={styles.subtitle}>{subtitle}</AppText>}

        {actionText && onPressAction && (
          <TouchableOpacity style={styles.actionBtn} onPress={onPressAction} activeOpacity={0.8}>
            <AppText style={styles.actionBtnText}>{actionText}</AppText>
            <AppIcon name="chevron-forward" size="xs" color={colors.primary.main} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  banner: {
    backgroundColor: colors.primary.main,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.large,
  },
  contentGroup: {
    alignItems: 'flex-start',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.wallet.addMoneyBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  title: {
    color: colors.text.inverse,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.background.default,
    opacity: 0.9,
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary.main,
    marginRight: 4,
  },
});

