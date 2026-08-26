import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { AppIcon } from '../../atoms/Icon';
import { AppText } from '../../atoms/AppText';
import { spacing, radius, useTheme } from '@theme/index';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBackPress,
  rightAction,
  style,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftContainer}>
        {onBackPress && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow-back" size="md" color={colors.text.primary} />
          </TouchableOpacity>
        )}
        <View style={styles.titleWrapper}>
          <AppText variant="headingLg" color="textPrimary" numberOfLines={1} style={styles.title}>
            {title}
          </AppText>
          {subtitle && (
            <AppText variant="caption" color="textSecondary" numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </AppText>
          )}
        </View>
      </View>
      {rightAction && <View style={styles.rightContainer}>{rightAction}</View>}
    </View>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: 0,
      marginBottom: spacing.sm + 2,
    },
    leftContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: colors.background.paper,
      borderWidth: 1,
      borderColor: colors.border.light,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm + 2,
    },
    titleWrapper: {
      flex: 1,
    },
    title: {
      letterSpacing: -0.2,
    },
    subtitle: {
      marginTop: 2,
    },
    rightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: spacing.sm,
    },
  });

