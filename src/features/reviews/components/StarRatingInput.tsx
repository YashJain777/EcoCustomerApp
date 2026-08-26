import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { AppText } from '@shared/components/atoms/AppText';
import { AppIcon } from '@shared/components/atoms/Icon';

export interface StarRatingInputProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  disabled?: boolean;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export const StarRatingInput: React.FC<StarRatingInputProps> = ({
  rating,
  onRatingChange,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {stars.map((starVal) => {
          const isSelected = starVal <= rating;
          const iconName = isSelected ? 'star' : 'star-outline';
          const starColor = isSelected ? colors.status.warning || '#F59E0B' : colors.border.dark || '#CBD5E1';
          return (
            <TouchableOpacity
              key={starVal}
              onPress={() => !disabled && onRatingChange(starVal)}
              activeOpacity={0.7}
              disabled={disabled}
              style={styles.starTouchable}
              accessibilityLabel={`Rate ${starVal} star${starVal > 1 ? 's' : ''}`}
            >
              <AppIcon
                name={iconName}
                family="Ionicons"
                size={34}
                color={starColor}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      {rating > 0 && (
        <AppText variant="labelLg" style={styles.label}>
          {rating} ★ — {RATING_LABELS[rating]}
        </AppText>
      )}
    </View>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: { alignItems: 'center', marginVertical: 12 },
    starsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    starTouchable: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
    label: { marginTop: 8, color: colors.status.warning, fontWeight: '700' },
  });
