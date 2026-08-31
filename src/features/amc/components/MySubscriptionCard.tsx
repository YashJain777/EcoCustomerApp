/**
 * @file MySubscriptionCard.tsx
 * @layer Features / AMC / Components
 * @responsibility Card displaying a customer's active or historical AMC subscription.
 *                 Shows validity progress, maintenance visit counters, expandable service history logs,
 *                 and mechanic contact info. Adheres strictly to DESIGN_SYSTEM.md.
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Card } from '@shared/components/atoms/Card';
import { Badge } from '@shared/components/atoms/Badge';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { spacing, radius, shadows, useTheme } from '@theme/index';
import { MyAmcPlan } from '@core/types/amc.types';

interface MySubscriptionCardProps {
  subscription: MyAmcPlan;
  onRequestVisit?: (sub: MyAmcPlan) => void;
}

export const MySubscriptionCard: React.FC<MySubscriptionCardProps> = ({
  subscription,
  onRequestVisit,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(false);

  const isActive = subscription.status === 'ACTIVE';
  const isExpired = subscription.status === 'EXPIRED';

  const planName = subscription.amcPlan?.name || 'Annual Maintenance Contract';
  const categoryName = subscription.amcPlan?.category?.name || 'All Appliances';

  const startDateStr = subscription.startDate
    ? new Date(subscription.startDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  const endDateStr = subscription.endDate
    ? new Date(subscription.endDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  // Validity progress calculation
  const progressPercent = useMemo(() => {
    if (!subscription.startDate || !subscription.endDate) return 100;
    const start = new Date(subscription.startDate).getTime();
    const end = new Date(subscription.endDate).getTime();
    const now = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }, [subscription.startDate, subscription.endDate]);

  const visits = subscription.visits || [];
  const completedVisits = visits.filter((v) => v.status === 'COMPLETED').length;
  const totalVisits = subscription.amcPlan?.visitsIncluded || visits.length || 2;

  const mechanic = subscription.mechanic;
  const mechanicPhone = mechanic?.user?.mobile;
  const mechanicName = mechanic?.user?.fullName || 'Assigned Certified Specialist';

  const handleCall = () => {
    if (mechanicPhone) {
      Linking.openURL(`tel:${mechanicPhone}`);
    }
  };

  return (
    <Card style={styles.card} padding="lg" variant="elevated">
      {/* Top Status & Shield Header */}
      <View style={styles.headerRow}>
        <View style={styles.badgeWrap}>
          <Badge
            label={isActive ? 'ACTIVE PROTECTION' : isExpired ? 'EXPIRED' : subscription.status}
            variant={isActive ? 'success' : isExpired ? 'danger' : 'neutral'}
          />
          <Badge label={categoryName} variant="primary" />
        </View>
        <View
          style={[
            styles.shieldBox,
            isActive ? styles.shieldBoxActive : styles.shieldBoxExpired,
          ]}
        >
          <AppIcon
            name={isActive ? 'shield-checkmark' : 'shield-outline'}
            size="sm"
            color={isActive ? colors.status.success : colors.status.danger}
          />
        </View>
      </View>

      {/* Plan Name & Validity */}
      <View style={styles.titleBlock}>
        <AppText variant="headingSm" color="textPrimary" numberOfLines={1}>
          {planName}
        </AppText>
        <AppText variant="caption" color="textSecondary" style={styles.validityDates}>
          Valid: {startDateStr} — {endDateStr}
        </AppText>
      </View>

      {/* Validity Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${progressPercent}%`,
                backgroundColor: isActive ? colors.primary.main : colors.neutral[400],
              },
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <AppText variant="caption" color="textMuted">
            {isActive ? `${100 - progressPercent}% validity remaining` : 'Plan expired'}
          </AppText>
          <AppText variant="caption" color="textMuted">
            {progressPercent}% elapsed
          </AppText>
        </View>
      </View>

      {/* Maintenance Visits Counter Pill */}
      <View style={styles.visitsCounterPill}>
        <View style={styles.visitsCounterLeft}>
          <AppIcon name="calendar-outline" size="xs" color={colors.primary.main} />
          <AppText variant="labelSm" color="textPrimary">
            Preventive Service Visits:
          </AppText>
        </View>
        <AppText variant="labelMd" color="primary" style={styles.visitsCountText}>
          {completedVisits} / {totalVisits} Completed
        </AppText>
      </View>

      {/* Mechanic Contact Strip */}
      <View style={styles.mechanicStrip}>
        <View style={styles.mechanicLeft}>
          <AppIcon name="person-circle-outline" size="sm" color={colors.text.secondary} />
          <View style={styles.mechanicTextCol}>
            <AppText variant="labelSm" color="textPrimary" numberOfLines={1}>
              {mechanicName}
            </AppText>
            <AppText variant="caption" color="textMuted">
              Authorized Service Provider
            </AppText>
          </View>
        </View>

        {mechanicPhone ? (
          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCall}
            activeOpacity={0.75}
          >
            <AppIcon name="call" size="xs" color={colors.primary.main} />
            <AppText variant="labelSm" color="primary">
              Call
            </AppText>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Expandable Visit History Accordion */}
      {visits.length > 0 ? (
        <View style={styles.visitHistorySection}>
          <TouchableOpacity
            style={styles.historyToggle}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.7}
          >
            <AppText variant="labelSm" color="textSecondary">
              Maintenance Visit History ({visits.length})
            </AppText>
            <AppIcon
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size="xs"
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          {expanded ? (
            <View style={styles.timelineList}>
              {visits.map((visit, idx) => {
                const isVisitDone = visit.status === 'COMPLETED';
                const vDateStr = visit.visitDate
                  ? new Date(visit.visitDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Scheduled';

                return (
                  <View key={visit.id || idx} style={styles.timelineItem}>
                    <View style={styles.timelineDotWrap}>
                      <View
                        style={[
                          styles.timelineDot,
                          isVisitDone
                            ? styles.timelineDotDone
                            : styles.timelineDotPending,
                        ]}
                      />
                      {idx < visits.length - 1 ? (
                        <View style={styles.timelineLine} />
                      ) : null}
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineTopRow}>
                        <AppText variant="labelSm" color="textPrimary">
                          Visit #{idx + 1} • {vDateStr}
                        </AppText>
                        <Badge
                          label={visit.status}
                          variant={isVisitDone ? 'success' : 'neutral'}
                        />
                      </View>
                      {visit.notes || visit.mechanicNotes ? (
                        <AppText
                          variant="caption"
                          color="textSecondary"
                          style={styles.visitNotes}
                        >
                          {visit.notes || visit.mechanicNotes}
                        </AppText>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      marginBottom: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.background.paper,
      ...shadows.medium,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs + 2,
    },
    badgeWrap: {
      flexDirection: 'row',
      gap: spacing.xs,
      flexWrap: 'wrap',
      flex: 1,
    },
    shieldBox: {
      width: 32,
      height: 32,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shieldBoxActive: {
      backgroundColor: colors.category.warrantyBg,
    },
    shieldBoxExpired: {
      backgroundColor: colors.status.dangerBg,
    },
    titleBlock: {
      marginTop: spacing.xs,
      marginBottom: spacing.xs + 2,
    },
    validityDates: {
      marginTop: 2,
    },
    progressContainer: {
      marginVertical: spacing.xs + 2,
    },
    progressTrack: {
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.background.default,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: radius.pill,
    },
    progressLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    visitsCounterPill: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.background.default,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.sm,
      marginVertical: spacing.xs + 2,
    },
    visitsCounterLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    visitsCountText: {
      fontWeight: '700',
    },
    mechanicStrip: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.background.default,
      borderRadius: radius.sm,
      marginTop: spacing.xs,
    },
    mechanicLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: spacing.xs,
    },
    mechanicTextCol: {
      flex: 1,
    },
    callBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary.light,
      paddingVertical: 4,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pill,
      gap: 4,
    },
    visitHistorySection: {
      marginTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      paddingTop: spacing.xs + 2,
    },
    historyToggle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    timelineList: {
      marginTop: spacing.xs,
      paddingLeft: 4,
    },
    timelineItem: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.xs + 2,
    },
    timelineDotWrap: {
      alignItems: 'center',
      width: 14,
    },
    timelineDot: {
      width: 10,
      height: 10,
      borderRadius: radius.pill,
      marginTop: 4,
    },
    timelineDotDone: {
      backgroundColor: colors.status.success,
    },
    timelineDotPending: {
      backgroundColor: colors.neutral[400],
    },
    timelineLine: {
      width: 2,
      flex: 1,
      backgroundColor: colors.border.light,
      marginTop: 2,
    },
    timelineContent: {
      flex: 1,
      paddingBottom: 4,
    },
    timelineTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    visitNotes: {
      marginTop: 2,
    },
  });
