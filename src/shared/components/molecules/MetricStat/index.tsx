import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppIcon } from '../../atoms/Icon';
import { AppText } from '../../atoms/AppText';
import { spacing, radius, shadows, useTheme } from '@theme/index';

export interface MetricStatProps {
  number: string | number;
  label: string;
  iconName?: string;
  iconColor?: string;
  bgColor?: string;
  onPress?: () => void;
}

export const MetricStat: React.FC<MetricStatProps> = ({
  number,
  label,
  iconName,
  iconColor,
  bgColor,
  onPress,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const resolvedIconColor = iconColor || colors.primary.main;
  const resolvedBgColor = bgColor || colors.primary.light;
  const content = (
    <View style={styles.card}>
      <View style={styles.topRow}>
        {iconName && (
          <View style={[styles.iconContainer, { backgroundColor: resolvedBgColor }]}>
            <AppIcon name={iconName} size="sm" color={resolvedIconColor} />
          </View>
        )}
        <AppText variant="headingLg" style={styles.numberText}>{number}</AppText>
      </View>
      <AppText variant="caption" style={styles.labelText} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.touchable}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.wrapper}>{content}</View>;
};

const makeStyles = (colors: any) => StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  touchable: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 84,
    ...shadows.small,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.xs,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontWeight: '800',
    color: colors.text.primary,
  },
  labelText: {
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 2,
  },
});

