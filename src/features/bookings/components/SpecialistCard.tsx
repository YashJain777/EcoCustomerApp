/**
 * @file SpecialistCard.tsx
 * @feature Bookings / Components
 * @responsibility Specialist/Technician/Shop selection card with rating, fee, and verification badges.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '@shared/components/atoms/AppText';
import { AppIcon } from '@shared/components/atoms/Icon';
import { Badge } from '@shared/components/atoms/Badge';
import { spacing, radius, useTheme } from '@theme/index';
import { AvailableMechanic, AvailableShop } from '@core/types/api';

export interface SpecialistCardProps {
  specialist: AvailableMechanic | AvailableShop;
  type: 'FREELANCER' | 'SHOPKEEPER';
  isSelected: boolean;
  onSelect: (specialist: AvailableMechanic | AvailableShop) => void;
  onPressDetails?: (specialist: AvailableMechanic | AvailableShop) => void;
}

export const SpecialistCard: React.FC<SpecialistCardProps> = ({
  specialist,
  type,
  isSelected,
  onSelect,
  onPressDetails,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const isShopkeeper = type === 'SHOPKEEPER';
  const shop = specialist as AvailableShop;
  const mechanic = specialist as AvailableMechanic;

  const displayName = isShopkeeper
    ? (shop.shopName || 'Authorized Service Center')
    : (mechanic.name || 'Certified Technician');

  const ownerName = isShopkeeper ? (shop.ownerName || undefined) : undefined;
  const rating = specialist.rating !== undefined ? specialist.rating : null;
  const offeredPrice = specialist.offeredPrice !== undefined ? specialist.offeredPrice : (specialist as any).price;

  const specialization = mechanic.specialization ||
    (shop.serviceArea ? `Service Area: ${shop.serviceArea}` : 'Authorized Service Center');

  const experienceYears = mechanic.experienceYears;

  const isAvailable = specialist.isAvailable !== false;
  const availabilityStatus = specialist.availabilityStatus || (isAvailable ? 'Available' : 'Busy / Offline');
  const busyReason = specialist.busyReason;

  // Get initials for avatar
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onSelect(specialist)}
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`Select ${displayName}`}
    >
      <View style={styles.contentRow}>
        {/* Avatar Circle */}
        <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
          <AppText variant="labelMd" style={styles.avatarText}>
            {initials || (type === 'FREELANCER' ? 'M' : 'S')}
          </AppText>
        </View>

        {/* Details Column */}
        <View style={styles.detailsCol}>
          <View style={styles.nameRow}>
            <AppText
              variant="headingSm"
              color="textPrimary"
              numberOfLines={1}
              style={[styles.name, isSelected && styles.nameSelected]}
            >
              {displayName}
            </AppText>
            {isShopkeeper && (
              <Badge label="Verified Center" variant="primary" style={styles.typeBadge} />
            )}
          </View>

          {ownerName ? (
            <AppText
              variant="caption"
              color="primary"
              numberOfLines={1}
              style={styles.ownerText}
            >
              Owner: {ownerName}
            </AppText>
          ) : null}

          {/* Subtitle / Specialization */}
          <AppText
            variant="caption"
            color="textSecondary"
            numberOfLines={1}
            style={styles.specialization}
          >
            {specialization}
          </AppText>

          {/* Badges / Rating Row */}
          <View style={styles.metaRow}>
            {rating !== null && rating > 0 ? (
              <View style={styles.ratingBadge}>
                <AppIcon name="star" size="xs" color={colors.status.warning} />
                <AppText variant="mono" style={styles.ratingText}>
                  {rating.toFixed(1)}
                </AppText>
              </View>
            ) : (
              <View style={styles.ratingBadge}>
                <AppIcon name="star-outline" size="xs" color={colors.status.warning} />
                <AppText variant="mono" style={styles.ratingText}>
                  New
                </AppText>
              </View>
            )}

            {experienceYears !== undefined && experienceYears > 0 && (
              <View style={styles.metaPill}>
                <AppText variant="caption" color="textSecondary">
                  {experienceYears}+ yrs exp
                </AppText>
              </View>
            )}

            {specialist.distanceKm !== undefined && (
              <View style={styles.distancePill}>
                <AppIcon name="location-outline" size="xs" color={colors.primary.main} />
                <AppText variant="caption" color="primary" style={styles.distanceText}>
                  {specialist.distanceKm} km
                </AppText>
              </View>
            )}

            <View style={[styles.availabilityPill, !isAvailable && styles.availabilityPillBusy]}>
              <View style={isAvailable ? styles.onlineDot : styles.busyDot} />
              <AppText variant="caption" style={isAvailable ? styles.onlineText : styles.busyText}>
                {availabilityStatus}
              </AppText>
            </View>
          </View>

          {busyReason ? (
            <AppText variant="caption" color="textMuted" numberOfLines={1} style={styles.busyReasonText}>
              • {busyReason}
            </AppText>
          ) : null}

          {onPressDetails ? (
            <TouchableOpacity
              style={styles.viewProfileBtn}
              onPress={() => onPressDetails(specialist)}
              activeOpacity={0.7}
            >
              <AppText variant="caption" color="primary" style={styles.viewProfileText}>
                View Profile & Reviews →
              </AppText>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Pricing / Action Column */}
        <View style={styles.pricingCol}>
          {offeredPrice !== null ? (
            <>
              <AppText variant="headingSm" color="primary" style={styles.priceAmount}>
                ₹{offeredPrice}
              </AppText>
              <AppText variant="caption" color="textSecondary" style={styles.priceLabel}>
                Visit & Inspection
              </AppText>
            </>
          ) : (
            <AppText variant="caption" color="textSecondary" style={styles.priceLabel}>
              Standard Rate
            </AppText>
          )}

          <View style={[styles.selectIndicator, isSelected && styles.selectIndicatorActive]}>
            {isSelected ? (
              <AppIcon name="checkmark" size="xs" color={colors.text.inverse} />
            ) : (
              <AppText variant="caption" style={styles.selectText}>
                Select
              </AppText>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.background.paper,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1.5,
      borderColor: colors.border.light,
      elevation: 2,
      shadowColor: colors.neutral[900],
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
    },
    cardSelected: {
      borderColor: colors.primary.main,
      backgroundColor: colors.primary.light,
      elevation: 3,
      shadowColor: colors.primary.main,
      shadowOpacity: 0.12,
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      backgroundColor: colors.primary.main,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm + 2,
    },
    avatarSelected: {
      backgroundColor: colors.primary.dark,
    },
    avatarText: {
      color: colors.text.inverse,
      fontWeight: '700',
    },
    detailsCol: {
      flex: 1,
      marginRight: spacing.xs,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    name: {
      fontWeight: '600',
      flexShrink: 1,
    },
    nameSelected: {
      color: colors.primary.main,
      fontWeight: '700',
    },
    typeBadge: {
      marginLeft: 6,
      paddingVertical: 2,
      paddingHorizontal: 6,
    },
    specialization: {
      marginBottom: 6,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.status.warningBg,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.xs,
    },
    ratingText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.status.warning,
    },
    metaPill: {
      backgroundColor: colors.neutral[100],
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.xs,
    },
    distancePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.primary.light,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.xs,
    },
    distanceText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.primary.main,
    },
    availabilityPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.status.successBg,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.xs,
    },
    onlineDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.status.success,
    },
    onlineText: {
      color: colors.status.success,
      fontSize: 10,
      fontWeight: '600',
    },
    ownerText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary.main,
      marginBottom: 2,
    },
    availabilityPillBusy: {
      backgroundColor: colors.status.warningBg || '#FEF3C7',
    },
    busyDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.status.warning || '#F59E0B',
    },
    busyText: {
      color: colors.status.warning || '#D97706',
      fontSize: 10,
      fontWeight: '600',
    },
    busyReasonText: {
      fontSize: 10,
      color: colors.text.muted,
      marginTop: 2,
    },
    viewProfileBtn: {
      marginTop: 6,
      alignSelf: 'flex-start',
    },
    viewProfileText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary.main,
    },
    pricingCol: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      minWidth: 80,
    },
    priceAmount: {
      fontWeight: '700',
    },
    priceLabel: {
      fontSize: 10,
      marginBottom: 6,
    },
    selectIndicator: {
      paddingHorizontal: spacing.xs + 4,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border.main,
      backgroundColor: colors.background.paper,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 54,
    },
    selectIndicatorActive: {
      backgroundColor: colors.primary.main,
      borderColor: colors.primary.main,
    },
    selectText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text.secondary,
    },
  });
