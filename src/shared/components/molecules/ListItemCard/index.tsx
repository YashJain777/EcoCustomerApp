import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Card } from '../../atoms/Card';
import { Badge, BadgeVariant } from '../../atoms/Badge';
import { AppIcon } from '../../atoms/Icon';
import { AppText } from '../../atoms/AppText';
import { spacing, radius, useTheme } from '@theme/index';

export interface ListItemCardProps {
  iconName: string;
  iconColor?: string;
  iconBgColor?: string;
  imageUrl?: string | null;
  title: string;
  subtitle?: string;
  metaText?: string;
  dateText?: string;
  statusLabel?: string;
  statusVariant?: BadgeVariant;
  onPress?: () => void;
  footerContent?: React.ReactNode;
}

export const ListItemCard: React.FC<ListItemCardProps> = ({
  iconName,
  iconColor,
  iconBgColor,
  imageUrl,
  title,
  subtitle,
  metaText,
  dateText,
  statusLabel,
  statusVariant = 'info',
  onPress,
  footerContent,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [imageError, setImageError] = useState(false);

  const resolvedIconColor = iconColor || colors.primary.main;
  const resolvedIconBgColor = iconBgColor || colors.category.indigoBg;

  return (
    <Card style={styles.card} padding="md" onPress={onPress}>
      <View style={styles.headerRow}>
        {imageUrl && !imageError ? (
          <View style={styles.imageThumbWrapper}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.imageThumb}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          </View>
        ) : (
          <View style={[styles.iconThumb, { backgroundColor: resolvedIconBgColor }]}>
            <AppIcon name={iconName} size="md" color={resolvedIconColor} />
          </View>
        )}

        <View style={styles.mainInfo}>
          <View style={styles.titleRow}>
            <AppText variant="headingSm" color="textPrimary" numberOfLines={1} style={styles.title}>
              {title}
            </AppText>
            {statusLabel && <Badge label={statusLabel} variant={statusVariant} />}
          </View>

          {subtitle && (
            <AppText variant="bodySm" color="textSecondary" numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </AppText>
          )}
          {metaText && (
            <AppText variant="caption" color="textMuted" numberOfLines={1} style={styles.metaText}>
              {metaText}
            </AppText>
          )}
          {dateText && (
            <AppText variant="caption" color="textMuted" style={styles.dateText}>
              {dateText}
            </AppText>
          )}
        </View>
      </View>

      {footerContent && <View style={styles.footerRow}>{footerContent}</View>}
    </Card>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      marginBottom: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconThumb: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm + 4,
    },
    imageThumbWrapper: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.background.paper,
      borderWidth: 1,
      borderColor: colors.border.light,
      marginRight: spacing.sm + 4,
    },
    imageThumb: {
      width: '100%',
      height: '100%',
    },
    mainInfo: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    title: {
      flex: 1,
      marginRight: spacing.xs,
    },
    subtitle: {
      marginTop: 2,
      fontWeight: '500',
    },
    metaText: {
      marginTop: 3,
    },
    dateText: {
      marginTop: 3,
    },
    footerRow: {
      marginTop: spacing.sm + 2,
      paddingTop: spacing.xs + 4,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  });
