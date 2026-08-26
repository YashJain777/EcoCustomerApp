import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { AppText } from '@shared/components/atoms/AppText';
import { AppIcon } from '@shared/components/atoms/Icon';

export interface StarRatingDisplayProps {
  rating: number;
  size?: number;
  showNumeric?: boolean;
}

export const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({
  rating,
  size = 18,
  showNumeric = true,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {stars.map((starVal) => {
          const isFilled = starVal <= Math.round(rating);
          const iconName = isFilled ? 'star' : 'star-outline';
          const iconColor = isFilled ? colors.status.warning || '#F59E0B' : colors.border.light || '#CBD5E1';
          return (
            <AppIcon
              key={starVal}
              name={iconName}
              family="Ionicons"
              size={size}
              color={iconColor}
              style={styles.starIcon}
            />
          );
        })}
      </View>
      {showNumeric && (
        <AppText variant="labelSm" style={styles.numericText}>
          {rating.toFixed(1)}
        </AppText>
      )}
    </View>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center' },
    starsRow: { flexDirection: 'row', alignItems: 'center' },
    starIcon: { marginRight: 2 },
    numericText: { marginLeft: 6, color: colors.text.primary, fontWeight: '700' },
  });
