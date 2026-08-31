/**
 * @file AmcPlanCard.tsx
 * @layer Features / AMC / Components
 * @responsibility Rich card rendering an available local AMC protection plan.
 *                 Displays price, duration, visits count, coverage checklist, provider info, and purchase CTA.
 *                 Adheres strictly to DESIGN_SYSTEM.md standards.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '@shared/components/atoms/Card';
import { Badge } from '@shared/components/atoms/Badge';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { Button } from '@shared/components/atoms/Button';
import { spacing, radius, shadows, useTheme } from '@theme/index';
import { LocalAmcPlan } from '@core/types/amc.types';

interface AmcPlanCardProps {
  plan: LocalAmcPlan;
  onSubscribe: (plan: LocalAmcPlan) => void;
}

export const AmcPlanCard: React.FC<AmcPlanCardProps> = ({ plan, onSubscribe }) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const coverageItems = useMemo(() => {
    if (!plan.coverageDetails) {
      return [
        `${plan.visitsIncluded || 2} Comprehensive Maintenance Visits`,
        'Priority Breakdown Assistance',
        'Certified Technician & Genuine Parts Check',
      ];
    }
    if (Array.isArray(plan.coverageDetails)) {
      return plan.coverageDetails;
    }
    return plan.coverageDetails
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [plan.coverageDetails, plan.visitsIncluded]);

  const mechanicName =
    plan.mechanic?.user?.fullName ||
    plan.mechanic?.shopName ||
    'Authorized Service Specialist';

  return (
    <Card style={styles.card} padding="lg" variant="elevated">
      {/* Top Category & Price Row */}
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          {plan.category?.name ? (
            <Badge label={plan.category.name} variant="primary" />
          ) : null}
          <Badge
            label={`${plan.durationMonths || 12} MONTHS`}
            variant="neutral"
          />
        </View>
        <View style={styles.priceContainer}>
          <AppText variant="headingLg" color="primary" style={styles.priceText}>
            ₹{plan.price.toLocaleString('en-IN')}
          </AppText>
          <AppText variant="caption" color="textMuted">
            / {plan.durationMonths || 12} mos
          </AppText>
        </View>
      </View>

      {/* Plan Title & Description */}
      <View style={styles.titleSection}>
        <AppText variant="headingMd" color="textPrimary" numberOfLines={1}>
          {plan.name}
        </AppText>
        {plan.description ? (
          <AppText
            variant="bodySm"
            color="textSecondary"
            numberOfLines={2}
            style={styles.descriptionText}
          >
            {plan.description}
          </AppText>
        ) : null}
      </View>

      {/* Maintenance Visits Highlight Pill */}
      <View style={styles.visitsHighlightPill}>
        <View style={styles.visitIconBox}>
          <AppIcon name="construct-outline" size="xs" color={colors.category.emeraldIcon} />
        </View>
        <AppText variant="labelMd" color="textPrimary" style={styles.visitPillText}>
          {plan.visitsIncluded || 2} Scheduled Preventive Service Visits Included
        </AppText>
      </View>

      {/* Coverage Features Checklist */}
      <View style={styles.coverageList}>
        {coverageItems.slice(0, 4).map((item, idx) => (
          <View key={idx} style={styles.coverageRow}>
            <AppIcon
              name="checkmark-circle"
              size="xs"
              color={colors.status.success}
            />
            <AppText
              variant="caption"
              color="textSecondary"
              style={styles.coverageText}
              numberOfLines={1}
            >
              {item}
            </AppText>
          </View>
        ))}
      </View>

      {/* Provider Details Bar */}
      <View style={styles.providerBar}>
        <View style={styles.providerLeft}>
          <AppIcon name="person-circle-outline" size="sm" color={colors.text.secondary} />
          <View style={styles.providerInfo}>
            <AppText variant="labelSm" color="textPrimary" numberOfLines={1}>
              {mechanicName}
            </AppText>
            <View style={styles.providerMeta}>
              <AppText variant="caption" color="textMuted">
                ⭐ {plan.mechanic?.rating ? plan.mechanic.rating.toFixed(1) : '4.9'}
              </AppText>
              {plan.mechanic?.distanceKm !== undefined ? (
                <AppText variant="caption" color="textMuted">
                  {' '}• 📍 {plan.mechanic.distanceKm} km away
                </AppText>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      {/* Purchase CTA */}
      <Button
        title="Subscribe & Protect"
        variant="primary"
        size="medium"
        onPress={() => onSubscribe(plan)}
        style={styles.ctaBtn}
      />
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
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.xs + 2,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      flexWrap: 'wrap',
      flex: 1,
    },
    priceContainer: {
      alignItems: 'flex-end',
      marginLeft: spacing.sm,
    },
    priceText: {
      fontWeight: '800',
      lineHeight: 24,
    },
    titleSection: {
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
    descriptionText: {
      marginTop: 2,
      lineHeight: 18,
    },
    visitsHighlightPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.category.warrantyBg,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.sm,
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    visitIconBox: {
      width: 22,
      height: 22,
      borderRadius: radius.pill,
      backgroundColor: colors.background.paper,
      alignItems: 'center',
      justifyContent: 'center',
    },
    visitPillText: {
      fontWeight: '600',
      flex: 1,
      fontSize: 12,
    },
    coverageList: {
      marginBottom: spacing.md,
      gap: 6,
    },
    coverageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    coverageText: {
      flex: 1,
      fontSize: 12,
    },
    providerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.background.default,
      borderRadius: radius.sm,
      marginBottom: spacing.md,
    },
    providerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: spacing.xs,
    },
    providerInfo: {
      flex: 1,
    },
    providerMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ctaBtn: {
      width: '100%',
    },
  });
