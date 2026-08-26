/**
 * @file ProductDocumentCard.tsx
 * @feature Products / Components
 * @responsibility Renders an individual product document item with thumbnail, type badge,
 *                 date, preview action, and deletion trigger according to DESIGN_SYSTEM.md.
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { AppText } from '@shared/components/atoms/AppText';
import { AppIcon } from '@shared/components/atoms/Icon';
import { Badge } from '@shared/components/atoms/Badge';
import { Card } from '@shared/components/atoms/Card';
import { spacing, radius, useTheme } from '@theme/index';
import { ProductDocument } from '@core/types/api';
import { resolveMediaUrl } from '@core/utils/imageUtils';

export interface ProductDocumentCardProps {
  document: ProductDocument;
  onPress: (doc: ProductDocument) => void;
  onDelete?: (doc: ProductDocument) => void;
  isDeleting?: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDocDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  return dateStr;
};

interface DocTypeConfig {
  label: string;
  icon: string;
  badgeVariant: 'primary' | 'success' | 'info' | 'warning' | 'neutral';
}

const getDocTypeConfig = (type?: string): DocTypeConfig => {
  const normalized = (type || '').toUpperCase();
  switch (normalized) {
    case 'INVOICE':
      return { label: 'Tax Invoice', icon: 'receipt-outline', badgeVariant: 'primary' };
    case 'WARRANTY_CARD':
      return { label: 'Warranty Card', icon: 'shield-checkmark-outline', badgeVariant: 'success' };
    case 'USER_MANUAL':
      return { label: 'User Manual', icon: 'book-outline', badgeVariant: 'info' };
    case 'INSTALLATION_RECEIPT':
      return { label: 'Installation Slip', icon: 'construct-outline', badgeVariant: 'warning' };
    default:
      return { label: 'Product Document', icon: 'document-text-outline', badgeVariant: 'neutral' };
  }
};

export const ProductDocumentCard: React.FC<ProductDocumentCardProps> = ({
  document,
  onPress,
  onDelete,
  isDeleting = false,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const [imageError, setImageError] = useState(false);
  const mediaUrl = resolveMediaUrl(document.url);
  const config = getDocTypeConfig(document.type);
  const dateStr = formatDocDate(document.createdAt);
  const isImage = Boolean(
    mediaUrl &&
    !imageError &&
    (document.mime?.startsWith('image/') ||
     document.url?.match(/\.(jpg|jpeg|png|webp|gif)$/i))
  );

  return (
    <Card style={styles.card} padding="sm" variant="outlined">
      <TouchableOpacity
        style={styles.touchArea}
        onPress={() => onPress(document)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`View ${config.label}`}
      >
        {/* Document Thumbnail / Icon Container */}
        <View style={styles.thumbnailWrapper}>
          {isImage ? (
            <Image
              source={{ uri: mediaUrl! }}
              style={styles.thumbnailImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.iconBox}>
              <AppIcon name={config.icon} size="md" color={colors.primary.main} />
            </View>
          )}
        </View>

        {/* Metadata Details */}
        <View style={styles.detailsCol}>
          <View style={styles.typeRow}>
            <Badge label={config.label} variant={config.badgeVariant} />
            {dateStr ? (
              <AppText variant="caption" color="textMuted">
                {dateStr}
              </AppText>
            ) : null}
          </View>

          <AppText
            variant="bodySm"
            color="textPrimary"
            numberOfLines={1}
            style={styles.fileName}
          >
            {document.url.split('/').pop() || 'Attachment'}
          </AppText>

          <View style={styles.viewHintRow}>
            <AppIcon name="eye-outline" size="xs" color={colors.primary.main} />
            <AppText variant="caption" color="primary" style={styles.viewHintText}>
              Tap to view full preview
            </AppText>
          </View>
        </View>
      </TouchableOpacity>

      {/* Delete Action Button */}
      {onDelete ? (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(document)}
          disabled={isDeleting}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${config.label}`}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.status.danger} />
          ) : (
            <AppIcon name="trash-outline" size="sm" color={colors.status.danger} />
          )}
        </TouchableOpacity>
      ) : null}
    </Card>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
      backgroundColor: colors.background.paper,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    touchArea: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    thumbnailWrapper: {
      width: 54,
      height: 54,
      borderRadius: radius.md,
      backgroundColor: colors.background.default,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border.light,
      marginRight: spacing.sm + 2,
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
    },
    iconBox: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary.light,
    },
    detailsCol: {
      flex: 1,
      justifyContent: 'center',
    },
    typeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 3,
    },
    fileName: {
      fontWeight: '600',
      marginBottom: 2,
    },
    viewHintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    viewHintText: {
      fontWeight: '500',
      fontSize: 11,
    },
    deleteBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      marginLeft: spacing.xs,
    },
  });
