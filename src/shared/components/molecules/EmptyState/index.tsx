import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppIcon, IconFamily } from '../../atoms/Icon';
import { AppText } from '../../atoms/AppText';
import { Button } from '../../atoms/Button';
import { spacing, useTheme } from '@theme/index';

export interface EmptyStateProps {
  iconName?: string;
  iconFamily?: IconFamily;
  title: string;
  description?: string;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName = 'cube-outline',
  iconFamily = 'Ionicons',
  title,
  description,
  actionTitle,
  onActionPress,
  style,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <AppIcon name={iconName} family={iconFamily} size={36} color={colors.primary.main} />
      </View>
      <AppText variant="headingSm" style={styles.title}>{title}</AppText>
      {description && <AppText variant="bodySm" style={styles.description}>{description}</AppText>}
      {actionTitle && onActionPress && (
        <Button
          title={actionTitle}
          onPress={onActionPress}
          variant="primary"
          size="small"
          style={styles.actionBtn}
        />
      )}
    </View>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  actionBtn: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
});

