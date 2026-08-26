/**
 * @file ServiceTypeCard.tsx
 * @feature Bookings / Components
 * @responsibility Service type selection card supporting API image URLs with vector icon fallback,
 *                 description, and radio indicator adhering to DESIGN_SYSTEM.md standards.
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { AppText } from '@shared/components/atoms/AppText';
import { AppIcon } from '@shared/components/atoms/Icon';
import { Badge } from '@shared/components/atoms/Badge';
import { spacing, radius, useTheme } from '@theme/index';
import { ServiceTypeItem } from '@core/types/api';
import { resolveMediaUrl } from '@core/utils/imageUtils';

export interface ServiceTypeCardProps {
  serviceType: ServiceTypeItem;
  isSelected: boolean;
  onSelect: (serviceType: ServiceTypeItem) => void;
}

const getServiceIcon = (name: string): string => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('clean') || lower.includes('wash') || lower.includes('jet') || lower.includes('foam')) {
    return 'sparkles-outline';
  }
  if (lower.includes('install') || lower.includes('setup') || lower.includes('uninstal')) {
    return 'build-outline';
  }
  if (lower.includes('repair') || lower.includes('fix') || lower.includes('diagnos') || lower.includes('check')) {
    return 'construct-outline';
  }
  if (lower.includes('gas') || lower.includes('cool') || lower.includes('ac')) {
    return 'snow-outline';
  }
  return 'construct-outline';
};

export const ServiceTypeCard: React.FC<ServiceTypeCardProps> = ({
  serviceType,
  isSelected,
  onSelect,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const [imageError, setImageError] = useState(false);
  const mediaUrl = resolveMediaUrl(serviceType.image);
  const iconName = getServiceIcon(serviceType.name);
  const showImage = Boolean(mediaUrl && !imageError);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onSelect(serviceType)}
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`Select service ${serviceType.name}`}
    >
      <View style={styles.cardContent}>
        {/* Visual Thumbnail: Remote Service Image or Semantic Vector Icon */}
        <View style={[styles.mediaWrapper, isSelected && styles.mediaWrapperSelected]}>
          {showImage ? (
            <Image
              source={{ uri: mediaUrl! }}
              style={styles.serviceImage}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <AppIcon
              name={iconName}
              size="sm"
              color={isSelected ? colors.text.inverse : colors.primary.main}
            />
          )}
        </View>

        {/* Info Column */}
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <AppText
              variant="headingSm"
              color="textPrimary"
              numberOfLines={1}
              style={[styles.title, isSelected && styles.titleSelected]}
            >
              {serviceType.name.trim()}
            </AppText>
            {serviceType.basePrice !== undefined && serviceType.basePrice > 0 && (
              <Badge
                label={`₹${serviceType.basePrice}`}
                variant="primary"
                style={styles.priceBadge}
              />
            )}
          </View>

          {/* Subtitle / Description if returned by API */}
          {serviceType.description ? (
            <AppText
              variant="bodySm"
              color="textSecondary"
              numberOfLines={2}
              style={styles.description}
            >
              {serviceType.description.trim()}
            </AppText>
          ) : null}

          {/* Value Badge Features */}
          <View style={styles.featuresRow}>
            <View style={styles.featurePill}>
              <AppIcon name="shield-checkmark-outline" size="xs" color={colors.status.success} />
              <AppText variant="caption" style={styles.featureText}>Verified Experts</AppText>
            </View>
            <View style={styles.featurePill}>
              <AppIcon name="time-outline" size="xs" color={colors.primary.main} />
              <AppText variant="caption" style={styles.featureText}>Same-Day Service</AppText>
            </View>
          </View>
        </View>

        {/* Radio Selection Indicator */}
        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
          {isSelected && <View style={styles.radioDot} />}
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
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    mediaWrapper: {
      width: 46,
      height: 46,
      borderRadius: radius.md,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm + 2,
      overflow: 'hidden',
    },
    mediaWrapperSelected: {
      backgroundColor: colors.primary.main,
    },
    serviceImage: {
      width: 36,
      height: 36,
      borderRadius: 4,
    },
    infoCol: {
      flex: 1,
      marginRight: spacing.xs,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    title: {
      flex: 1,
      fontWeight: '600',
      marginRight: spacing.xs,
    },
    titleSelected: {
      color: colors.primary.main,
      fontWeight: '700',
    },
    priceBadge: {
      marginLeft: spacing.xs,
    },
    description: {
      lineHeight: 16,
      marginBottom: 4,
      marginTop: 2,
    },
    featuresRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: 2,
    },
    featurePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    featureText: {
      color: colors.text.secondary,
      fontSize: 11,
    },
    radioCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.border.main,
      backgroundColor: colors.background.paper,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: spacing.xs,
    },
    radioCircleSelected: {
      borderColor: colors.primary.main,
    },
    radioDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary.main,
    },
  });
