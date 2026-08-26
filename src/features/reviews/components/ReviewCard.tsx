/**
 * @file ReviewCard.tsx
 * @feature Reviews / Components
 * @responsibility Presentational card for rendering individual submitted review details in review history list.
 */

import React, { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '@theme/ThemeContext';
import { AppText } from '@shared/components/atoms/AppText';
import { resolveMediaUrl } from '@core/utils/imageUtils';
import { ReviewItem } from '../types/reviews.types';
import { StarRatingDisplay } from './StarRatingDisplay';

export interface ReviewCardProps {
  item: ReviewItem;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ item }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const formattedDate = useMemo(() => {
    if (!item.createdAt) return '';
    try {
      const d = new Date(item.createdAt);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return item.createdAt;
    }
  }, [item.createdAt]);

  const isInstallation = item.type === 'INSTALLATION' || item.jobType === 'INSTALLATION';
  const displayTitle = item.serviceType || item.description || (isInstallation ? 'Product Installation' : 'Service Request');

  return (
    <View style={styles.cardContainer}>
      {/* Header Row: Job Type Badge & Date */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.badge,
            isInstallation ? styles.badgeSecondary : styles.badgePrimary,
          ]}
        >
          <Feather
            name={isInstallation ? 'check-circle' : 'tool'}
            size={12}
            color={isInstallation ? colors.secondary.main : colors.primary.main}
          />
          <AppText
            variant="caption"
            style={[
              styles.badgeText,
              isInstallation ? styles.badgeTextSecondary : styles.badgeTextPrimary,
            ]}
          >
            {isInstallation ? 'INSTALLATION' : 'SERVICE JOB'}
          </AppText>
        </View>

        {Boolean(formattedDate) && (
          <AppText variant="caption" style={styles.dateText}>
            {formattedDate}
          </AppText>
        )}
      </View>

      {/* Title / Description & Mechanic */}
      {Boolean(displayTitle) && (
        <AppText variant="headingSm" style={styles.descriptionText}>
          {displayTitle}
        </AppText>
      )}

      {Boolean(item.mechanicName) && (
        <View style={styles.mechanicRow}>
          <Feather name="user" size={14} color={colors.text.secondary} />
          <AppText variant="bodySm" style={styles.mechanicText}>
            Mechanic: {item.mechanicName}
          </AppText>
        </View>
      )}

      {/* Star Rating Display */}
      <View style={styles.ratingRow}>
        <StarRatingDisplay rating={item.rating} size={18} />
      </View>

      {/* Feedback Text */}
      {Boolean(item.feedback) && (
        <AppText variant="bodyMd" style={styles.feedbackText}>
          "{item.feedback}"
        </AppText>
      )}

      {/* Media Thumbnails Grid */}
      {Boolean(item.media && item.media.length > 0) && (
        <View style={styles.mediaContainer}>
          {item.media?.map((m, idx) => {
            const uri = resolveMediaUrl(m.url) || m.url;
            return (
              <View key={m.id || idx} style={styles.mediaWrap}>
                <Image source={{ uri }} style={styles.mediaImage} resizeMode="cover" />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    cardContainer: { backgroundColor: colors.background.paper, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border.light, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
    badgePrimary: { backgroundColor: colors.primary.light || colors.neutral[100] },
    badgeSecondary: { backgroundColor: colors.secondary.light || colors.neutral[100] },
    badgeText: { fontWeight: '700' },
    badgeTextPrimary: { color: colors.primary.main },
    badgeTextSecondary: { color: colors.secondary.main },
    dateText: { color: colors.text.muted },
    descriptionText: { color: colors.text.primary, fontWeight: '700', marginBottom: 4 },
    mechanicRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    mechanicText: { color: colors.text.secondary },
    ratingRow: { marginBottom: 8 },
    feedbackText: { color: colors.text.primary, fontStyle: 'italic', lineHeight: 20, marginBottom: 8 },
    mediaContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    mediaWrap: { width: 64, height: 64, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.neutral[100], borderWidth: 1, borderColor: colors.border.light },
    mediaImage: { width: '100%', height: '100%' },
  });
