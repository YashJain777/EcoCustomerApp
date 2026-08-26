import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@theme/ThemeContext';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { Header } from '@shared/components/molecules/Header';
import { AppText, AppButton } from '@shared/components/atoms';
import { AppIcon } from '@shared/components/atoms/Icon';
import { RootStackParamList } from '@navigation/types/navigation.types';
import { useSubmitReview } from '../hooks/useSubmitReview';
import { StarRatingInput } from '../components/StarRatingInput';

type SubmitReviewRouteProp = RouteProp<RootStackParamList, 'SubmitReviewScreen'>;

export const SubmitReviewScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<SubmitReviewRouteProp>();
  const { jobId, jobType, description, mechanicName } = route.params || {};

  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleSuccess = () => {
    navigation.goBack();
  };

  const {
    rating,
    setRating,
    feedback,
    setFeedback,
    images,
    pickFromCamera,
    pickFromGallery,
    removeImage,
    isSubmitting,
    isUploadingMedia,
    error,
    submitReview,
  } = useSubmitReview({
    jobId: jobId || '',
    jobType: jobType || 'SERVICE_JOB',
    onSuccess: handleSuccess,
  });

  const onSubmit = async () => {
    await submitReview();
  };

  const isMaxPhotosReached = images.length >= 5;

  return (
    <ScreenWrapper scrollable keyboardAvoiding contentContainerStyle={styles.container}>
      <Header
        title="Submit Review"
        subtitle="Share your experience"
        onBackPress={() => navigation.goBack()}
      />

      {/* Job Summary Header Card */}
      <View style={styles.jobCard}>
        <View style={styles.jobBadgeRow}>
          <View style={styles.badgeWrap}>
            <AppIcon
              name={jobType === 'INSTALLATION' ? 'checkmark-circle' : 'construct'}
              size="xs"
              color={colors.primary.main}
            />
            <AppText variant="caption" style={styles.badgeText}>
              {jobType === 'INSTALLATION' ? 'INSTALLATION' : 'SERVICE JOB'}
            </AppText>
          </View>
          <AppText variant="caption" style={styles.jobIdText}>
            Job #{jobId ? jobId.slice(0, 8) : ''}
          </AppText>
        </View>

        {Boolean(description) && (
          <AppText variant="headingSm" style={styles.jobTitle}>
            {description}
          </AppText>
        )}

        {Boolean(mechanicName) && (
          <View style={styles.mechanicRow}>
            <AppIcon name="person" size="xs" color={colors.text.secondary} />
            <AppText variant="bodySm" style={styles.mechanicText}>
              Assigned Specialist: {mechanicName}
            </AppText>
          </View>
        )}
      </View>

      {/* Error Banner */}
      {Boolean(error) && (
        <View style={styles.errorBanner}>
          <AppIcon name="alert-circle" size="sm" color={colors.status.danger} />
          <AppText variant="caption" style={styles.errorText}>
            {error}
          </AppText>
        </View>
      )}

      {/* Rating Card */}
      <View style={styles.formCard}>
        <AppText variant="headingSm" style={styles.cardHeading}>
          Overall Satisfaction
        </AppText>
        <AppText variant="bodySm" style={styles.cardSubheading}>
          Tap stars to rate your service quality
        </AppText>

        <StarRatingInput rating={rating} onRatingChange={setRating} disabled={isSubmitting} />
      </View>

      {/* Feedback Text Card */}
      <View style={styles.formCard}>
        <View style={styles.cardHeaderRow}>
          <AppText variant="headingSm" style={styles.cardHeading}>
            Detailed Feedback
          </AppText>
          <AppText variant="caption" style={styles.counterText}>
            {feedback.length}/500
          </AppText>
        </View>

        <View style={styles.textAreaWrap}>
          <TextInput
            value={feedback}
            onChangeText={setFeedback}
            placeholder="Tell us what you liked or how we can improve..."
            placeholderTextColor={colors.text.muted}
            multiline
            numberOfLines={4}
            maxLength={500}
            editable={!isSubmitting}
            style={styles.textAreaInput}
          />
        </View>
      </View>

      {/* Media Photo Upload Card */}
      <View style={styles.formCard}>
        <View style={styles.cardHeaderRow}>
          <AppText variant="headingSm" style={styles.cardHeading}>
            Add Photos (Optional)
          </AppText>
          <AppText variant="caption" style={styles.counterText}>
            {images.length}/5 Photos
          </AppText>
        </View>
        <AppText variant="bodySm" style={styles.cardSubheading}>
          Capture or upload photos of the completed work or parts.
        </AppText>

        {/* Upload Action Buttons */}
        <View style={styles.uploadActionsRow}>
          <TouchableOpacity
            style={[
              styles.uploadActionBtn,
              isMaxPhotosReached && styles.uploadActionBtnDisabled,
            ]}
            onPress={pickFromCamera}
            disabled={isSubmitting || isMaxPhotosReached}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: colors.primary.light }]}>
              <AppIcon name="camera" size="sm" color={colors.primary.main} />
            </View>
            <AppText
              variant="labelSm"
              color={isMaxPhotosReached ? 'textMuted' : 'primary'}
              style={styles.actionBtnText}
            >
              Take Photo
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.uploadActionBtn,
              isMaxPhotosReached && styles.uploadActionBtnDisabled,
            ]}
            onPress={pickFromGallery}
            disabled={isSubmitting || isMaxPhotosReached}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: colors.category.emeraldBg || '#DCFCE7' }]}>
              <AppIcon name="images" size="sm" color={colors.category.emeraldIcon || '#16A34A'} />
            </View>
            <AppText
              variant="labelSm"
              color={isMaxPhotosReached ? 'textMuted' : 'textPrimary'}
              style={styles.actionBtnText}
            >
              From Gallery
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Image Previews Grid */}
        {images.length > 0 && (
          <View style={styles.imagesGrid}>
            {images.map((img, idx) => (
              <View key={idx} style={styles.imageThumbnailWrap}>
                <Image source={{ uri: img.uri }} style={styles.imageThumbnail} />
                {img.isUploading && (
                  <View style={styles.imageUploadingOverlay}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => removeImage(idx)}
                  activeOpacity={0.8}
                  disabled={isSubmitting}
                  accessibilityLabel="Remove photo"
                >
                  <AppIcon name="close" size="xs" color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Submit Button */}
      <View style={styles.submitWrap}>
        <AppButton
          title={isUploadingMedia ? 'Uploading Photos...' : 'Submit Review'}
          onPress={onSubmit}
          loading={isSubmitting}
          disabled={isSubmitting || isUploadingMedia}
          variant="primary"
        />
      </View>
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: { paddingHorizontal: 16, paddingBottom: 32 },
    jobCard: { backgroundColor: colors.background.paper, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border.light },
    jobBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    badgeWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary.light || colors.neutral[100], paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
    badgeText: { color: colors.primary.main, fontWeight: '700' },
    jobIdText: { color: colors.text.muted },
    jobTitle: { color: colors.text.primary, fontWeight: '700', marginBottom: 4 },
    mechanicRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    mechanicText: { color: colors.text.secondary },
    errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.status.dangerBg || '#FEE2E2', padding: 12, borderRadius: 8, marginBottom: 16, gap: 8 },
    errorText: { color: colors.status.danger, flex: 1, fontWeight: '600' },
    formCard: { backgroundColor: colors.background.paper, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border.light },
    cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    cardHeading: { color: colors.text.primary, fontWeight: '700' },
    cardSubheading: { color: colors.text.secondary, marginBottom: 12 },
    counterText: { color: colors.text.muted },
    textAreaWrap: { borderWidth: 1, borderColor: colors.border.light, borderRadius: 8, backgroundColor: colors.background.default, padding: 8, minHeight: 100 },
    textAreaInput: { color: colors.text.primary, fontSize: 14, textAlignVertical: 'top', minHeight: 80 },
    uploadActionsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    uploadActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.background.default },
    uploadActionBtnDisabled: { opacity: 0.5 },
    actionIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    actionBtnText: { fontWeight: '700' },
    imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
    imageThumbnailWrap: { width: 72, height: 72, borderRadius: 10, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: colors.border.light },
    imageThumbnail: { width: '100%', height: '100%', borderRadius: 10 },
    imageUploadingOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
    removeImageBtn: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.9)', alignItems: 'center', justifyContent: 'center' },
    submitWrap: { marginTop: 8 },
  });

