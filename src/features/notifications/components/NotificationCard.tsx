/**
 * @file NotificationCard.tsx
 * @feature Notifications / Components
 * @responsibility Renders an individual notification item with semantic icon, category badge,
 *                 relative time, unread indicator dot, and contextual action button.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '@shared/components/atoms/Card';
import { Badge, BadgeVariant } from '@shared/components/atoms/Badge';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { spacing, radius, useTheme } from '@theme/index';
import { NotificationItem } from '@core/types/api';

export interface NotificationCardProps {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
}

const formatRelativeTime = (dateStr?: string | null): string => {
  if (!dateStr) return 'Recent';
  const now = new Date();
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 45) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

interface NotificationVisualConfig {
  iconName: string;
  iconColor: string;
  iconBgColor: string;
  badgeLabel: string;
  badgeVariant: BadgeVariant;
  actionLabel?: string;
}

const getNotificationVisualConfig = (item: NotificationItem, colors: any): NotificationVisualConfig => {
  const title = (item.title || item.meta?.title || '').toLowerCase();
  const body = (item.body || item.subtitle || '').toLowerCase();
  const type = (item.type || '').toUpperCase();
  const metaData = item.meta?.data || {};

  // 1. Installation Notifications
  if (type === 'INSTALLATION' || metaData.type === 'INSTALLATION' || title.includes('installation')) {
    if (body.includes('cancelled') || metaData.status === 'CANCELLED') {
      return {
        iconName: 'close-circle-outline',
        iconColor: colors.status.danger,
        iconBgColor: colors.status.dangerBg,
        badgeLabel: 'Cancelled',
        badgeVariant: 'danger',
        actionLabel: 'View Appliance',
      };
    }
    if (title.includes('scheduled') || body.includes('scheduled')) {
      return {
        iconName: 'calendar-outline',
        iconColor: colors.primary.main,
        iconBgColor: colors.primary.light,
        badgeLabel: 'Installation',
        badgeVariant: 'primary',
        actionLabel: 'View Schedule',
      };
    }
    return {
      iconName: 'construct-outline',
      iconColor: colors.primary.main,
      iconBgColor: colors.primary.light,
      badgeLabel: 'Installation',
      badgeVariant: 'info',
      actionLabel: 'View Appliance',
    };
  }

  // 2. Feedback / Rating Reminder
  if (title.includes('feedback') || title.includes('rate') || body.includes('rate and review')) {
    return {
      iconName: 'star-outline',
      iconColor: colors.status.warning,
      iconBgColor: colors.status.warningBg,
      badgeLabel: 'Rate Service',
      badgeVariant: 'warning',
      actionLabel: 'Leave Review ★',
    };
  }

  // 3. Mechanic / Technician Assigned
  if (title.includes('assigned') || body.includes('assigned to mechanic') || body.includes('mechanic')) {
    return {
      iconName: 'person-outline',
      iconColor: colors.secondary.main,
      iconBgColor: colors.secondary.light,
      badgeLabel: 'Tech Assigned',
      badgeVariant: 'info',
      actionLabel: 'Track Technician',
    };
  }

  // 4. Service Visit Started
  if (title.includes('service started') || body.includes('visit has started')) {
    return {
      iconName: 'play-circle-outline',
      iconColor: colors.status.warning,
      iconBgColor: colors.status.warningBg,
      badgeLabel: 'In Progress',
      badgeVariant: 'warning',
      actionLabel: 'Live Service Status',
    };
  }

  // 5. Service Approved / Confirmed
  if (title.includes('approved') || title.includes('confirmed') || body.includes('approved') || body.includes('confirmed')) {
    return {
      iconName: 'checkmark-circle-outline',
      iconColor: colors.status.success,
      iconBgColor: colors.status.successBg,
      badgeLabel: title.includes('approved') ? 'Approved' : 'Confirmed',
      badgeVariant: 'success',
      actionLabel: 'View Booking',
    };
  }

  // 6. Complaint / Request Created
  if (title.includes('created') || body.includes('registered') || body.includes('created')) {
    return {
      iconName: 'document-text-outline',
      iconColor: colors.primary.main,
      iconBgColor: colors.primary.light,
      badgeLabel: 'Request Logged',
      badgeVariant: 'primary',
      actionLabel: 'View Request',
    };
  }

  // 7. Service Completed / Resolved
  if (title.includes('completed') || title.includes('resolved') || body.includes('completed') || body.includes('resolved')) {
    return {
      iconName: 'shield-checkmark-outline',
      iconColor: colors.status.success,
      iconBgColor: colors.status.successBg,
      badgeLabel: 'Resolved',
      badgeVariant: 'success',
      actionLabel: 'View Report',
    };
  }

  // Default fallback
  return {
    iconName: 'notifications-outline',
    iconColor: colors.primary.main,
    iconBgColor: colors.primary.light,
    badgeLabel: 'Alert',
    badgeVariant: 'neutral',
    actionLabel: 'View Details',
  };
};

export const NotificationCard: React.FC<NotificationCardProps> = ({ item, onPress }) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const isRead = Boolean(item.read || item.isRead || item.status === 'READ');
  const config = getNotificationVisualConfig(item, colors);
  const timeText = formatRelativeTime(item.createdAt);
  const displayTitle = item.title || item.meta?.title || 'Notification';
  const displayBody = item.body || item.subtitle || item.message || '';

  return (
    <Card
      style={[styles.card, !isRead && styles.unreadCard]}
      padding="none"
      variant="outlined"
    >
      <TouchableOpacity
        style={styles.touchableArea}
        onPress={() => onPress(item)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${displayTitle}, ${isRead ? 'read' : 'unread'}`}
      >
        <View style={styles.topRow}>
          {/* Semantic Icon Box */}
          <View style={[styles.iconThumb, { backgroundColor: isRead ? colors.background.default : config.iconBgColor }]}>
            <AppIcon
              name={config.iconName}
              size="md"
              color={isRead ? colors.text.secondary : config.iconColor}
            />
          </View>

          {/* Title and Metadata */}
          <View style={styles.contentCol}>
            <View style={styles.headerMetaRow}>
              <Badge label={config.badgeLabel} variant={isRead ? 'neutral' : config.badgeVariant} />
              <View style={styles.timeGroup}>
                {!isRead && <View style={styles.unreadDot} />}
                <AppText variant="caption" color="textMuted" style={styles.timeText}>
                  {timeText}
                </AppText>
              </View>
            </View>

            <AppText
              variant="labelMd"
              color="textPrimary"
              style={[styles.title, !isRead && styles.boldTitle]}
              numberOfLines={2}
            >
              {displayTitle}
            </AppText>

            {displayBody ? (
              <AppText
                variant="bodySm"
                color={isRead ? 'textSecondary' : 'textPrimary'}
                style={styles.bodyText}
                numberOfLines={3}
              >
                {displayBody}
              </AppText>
            ) : null}

            {/* Contextual Action Bar */}
            <View style={styles.actionRow}>
              <AppText variant="caption" color="primary" style={styles.actionText}>
                {config.actionLabel}
              </AppText>
              <AppIcon name="chevron-forward" size="xs" color={colors.primary.main} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      marginBottom: spacing.sm + 2,
      backgroundColor: colors.background.paper,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
      overflow: 'hidden',
    },
    unreadCard: {
      backgroundColor: colors.background.paper,
      borderColor: colors.primary.main,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary.main,
    },
    touchableArea: {
      padding: spacing.md,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconThumb: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm + 2,
    },
    contentCol: {
      flex: 1,
    },
    headerMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    timeGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary.main,
    },
    timeText: {
      fontSize: 11,
    },
    title: {
      marginBottom: 3,
      fontWeight: '600',
    },
    boldTitle: {
      fontWeight: '700',
    },
    bodyText: {
      lineHeight: 18,
      marginBottom: spacing.xs,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    actionText: {
      fontWeight: '700',
      fontSize: 11,
    },
  });
