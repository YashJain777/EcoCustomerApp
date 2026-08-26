/**
 * @file CategoryCard.tsx
 * @feature Bookings / Components
 * @responsibility 2-column appliance category selection card supporting API image URLs
 *                 with vector icon fallback, adhering to DESIGN_SYSTEM.md standards.
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { AppText } from '@shared/components/atoms/AppText';
import { AppIcon } from '@shared/components/atoms/Icon';
import { spacing, radius, useTheme } from '@theme/index';
import { ProductCategory } from '@core/types/api';
import { resolveMediaUrl } from '@core/utils/imageUtils';

export interface CategoryCardProps {
  category: ProductCategory;
  isSelected: boolean;
  onSelect: (category: ProductCategory) => void;
}

const getCategoryIcon = (name: string): string => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('ac') || lower.includes('air') || lower.includes('conditioner')) return 'snow-outline';
  if (lower.includes('bulb') || lower.includes('light')) return 'bulb-outline';
  if (lower.includes('refriger') || lower.includes('fridge')) return 'cube-outline';
  if (lower.includes('wash') || lower.includes('laundry')) return 'refresh-circle-outline';
  if (lower.includes('desktop') || lower.includes('computer')) return 'desktop-outline';
  if (lower.includes('laptop')) return 'laptop-outline';
  if (lower.includes('monitor') || lower.includes('tv') || lower.includes('televis')) return 'tv-outline';
  if (lower.includes('headphone') || lower.includes('earphone') || lower.includes('audio')) return 'headset-outline';
  if (lower.includes('inverter') || lower.includes('inveter')) return 'flash-outline';
  if (lower.includes('iron')) return 'flame-outline';
  if (lower.includes('micro') || lower.includes('oven')) return 'restaurant-outline';
  if (lower.includes('purif') || lower.includes('ro') || lower.includes('water')) return 'water-outline';
  if (lower.includes('geyser') || lower.includes('heat')) return 'thermometer-outline';
  if (lower.includes('fan') || lower.includes('cooler')) return 'radio-outline';
  if (lower.includes('phone') || lower.includes('mobile')) return 'phone-portrait-outline';
  if (lower.includes('tablet') || lower.includes('pad')) return 'tablet-portrait-outline';
  if (lower.includes('weight') || lower.includes('scale')) return 'speedometer-outline';
  return 'construct-outline';
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected,
  onSelect,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const [imageError, setImageError] = useState(false);
  const mediaUrl = resolveMediaUrl(category.image);
  const iconName = getCategoryIcon(category.name);

  const showImage = Boolean(mediaUrl && !imageError);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onSelect(category)}
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`Select ${category.name}`}
    >
      {/* Selected Top-Right Badge */}
      {isSelected && (
        <View style={styles.selectedBadge}>
          <AppIcon name="checkmark" size="xs" color={colors.text.inverse} />
        </View>
      )}

      {/* Visual Container: Remote Image or Semantic Vector Icon */}
      <View
        style={[
          styles.mediaContainer,
          isSelected && styles.mediaContainerSelected,
        ]}
      >
        {showImage ? (
          <Image
            source={{ uri: mediaUrl! }}
            style={styles.categoryImg}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <AppIcon
            name={iconName}
            size="md"
            color={isSelected ? colors.text.inverse : colors.primary.main}
          />
        )}
      </View>

      {/* Title */}
      <AppText
        variant="headingSm"
        color="textPrimary"
        numberOfLines={1}
        style={[styles.title, isSelected && styles.titleSelected]}
      >
        {category.name.trim()}
      </AppText>

      {/* Subtitle / Description (Cleanly rendered if returned by API) */}
      {category.description ? (
        <AppText
          variant="caption"
          color="textSecondary"
          numberOfLines={2}
          style={styles.description}
        >
          {category.description.trim()}
        </AppText>
      ) : null}
    </TouchableOpacity>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.background.paper,
      borderRadius: radius.lg,
      padding: spacing.sm + 4,
      margin: spacing.xs,
      borderWidth: 1.5,
      borderColor: colors.border.light,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 125,
      elevation: 2,
      shadowColor: colors.neutral[900],
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      position: 'relative',
    },
    cardSelected: {
      borderColor: colors.primary.main,
      backgroundColor: colors.primary.light,
      elevation: 4,
      shadowColor: colors.primary.main,
      shadowOpacity: 0.15,
    },
    selectedBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.primary.main,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    mediaContainer: {
      width: 52,
      height: 52,
      borderRadius: radius.pill,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs + 2,
      overflow: 'hidden',
    },
    mediaContainerSelected: {
      backgroundColor: colors.primary.main,
    },
    categoryImg: {
      width: 38,
      height: 38,
      borderRadius: 6,
    },
    title: {
      textAlign: 'center',
      marginBottom: 2,
      fontWeight: '600',
    },
    titleSelected: {
      color: colors.primary.main,
      fontWeight: '700',
    },
    description: {
      textAlign: 'center',
      lineHeight: 14,
      marginTop: 2,
      paddingHorizontal: 2,
    },
  });
