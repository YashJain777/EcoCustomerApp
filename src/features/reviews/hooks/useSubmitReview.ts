/**
 * @file useSubmitReview.ts
 * @feature Reviews / Hooks
 * @responsibility Business logic, validation, image picking from Camera/Gallery, and review submit handler.
 */

import { useState, useCallback } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';
import { JobType } from '../types/reviews.types';
import { reviewsApi } from '../api/reviewsApi';
import { axiosInstance } from '@infrastructure/api/axiosInstance';

export interface ReviewImageItem {
  uri: string;
  fileName?: string;
  type?: string;
  uploadedUrl?: string;
  isUploading?: boolean;
}

export interface UseSubmitReviewProps {
  jobId: string;
  jobType: JobType;
  onSuccess?: () => void;
}

export interface UseSubmitReviewReturn {
  rating: number;
  setRating: (rating: number) => void;
  feedback: string;
  setFeedback: (text: string) => void;
  images: ReviewImageItem[];
  pickFromCamera: () => Promise<void>;
  pickFromGallery: () => Promise<void>;
  removeImage: (index: number) => void;
  isSubmitting: boolean;
  isUploadingMedia: boolean;
  error: string | null;
  submitReview: () => Promise<boolean>;
}

export const useSubmitReview = ({
  jobId,
  jobType,
  onSuccess,
}: UseSubmitReviewProps): UseSubmitReviewReturn => {
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');
  const [images, setImages] = useState<ReviewImageItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera access to attach service photos to your review.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch {
        return false;
      }
    }
    return true;
  };

  const uploadSingleImage = async (
    asset: Asset
  ): Promise<string> => {
    if (!asset.uri) return '';
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.fileName || `review_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      } as any);
      formData.append('entityType', 'review');
      formData.append('entityId', jobId || 'review');
      formData.append('type', 'PHOTO');

      const res: any = await axiosInstance.post('/v1/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const serverUrl = res?.data?.url || res?.url;
      if (serverUrl) return serverUrl;
    } catch (uploadErr) {
      // Non-blocking fallback
    }
    return asset.uri;
  };

  const processAndAddAssets = useCallback(
    async (assets: Asset[]) => {
      if (!assets || assets.length === 0) return;

      const remainingSlots = 5 - images.length;
      if (remainingSlots <= 0) {
        setError('Maximum 5 images allowed per review.');
        return;
      }

      const validAssets = assets.slice(0, remainingSlots).filter((a) => Boolean(a.uri));
      if (validAssets.length === 0) return;

      const newItems: ReviewImageItem[] = validAssets.map((a) => ({
        uri: a.uri!,
        fileName: a.fileName,
        type: a.type,
        isUploading: true,
      }));

      setImages((prev) => [...prev, ...newItems]);
      setIsUploadingMedia(true);
      setError(null);

      // Upload in background
      try {
        const uploadedUrls = await Promise.all(
          validAssets.map((asset) => uploadSingleImage(asset))
        );

        setImages((prev) =>
          prev.map((item) => {
            const matchIndex = validAssets.findIndex((a) => a.uri === item.uri);
            if (matchIndex >= 0) {
              return {
                ...item,
                uploadedUrl: uploadedUrls[matchIndex],
                isUploading: false,
              };
            }
            return item;
          })
        );
      } catch {
        setImages((prev) =>
          prev.map((item) => ({
            ...item,
            uploadedUrl: item.uploadedUrl || item.uri,
            isUploading: false,
          }))
        );
      } finally {
        setIsUploadingMedia(false);
      }
    },
    [images.length, jobId, jobType]
  );

  const pickFromCamera = useCallback(async () => {
    if (images.length >= 5) {
      setError('Maximum 5 images allowed per review.');
      return;
    }

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Camera permission is required to capture photos.');
      return;
    }

    try {
      const res = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
      });

      if (res.assets && res.assets.length > 0) {
        await processAndAddAssets(res.assets);
      }
    } catch {
      Alert.alert('Camera Error', 'Could not open camera. Please try again.');
    }
  }, [images.length, processAndAddAssets]);

  const pickFromGallery = useCallback(async () => {
    if (images.length >= 5) {
      setError('Maximum 5 images allowed per review.');
      return;
    }

    const maxSelect = Math.max(1, 5 - images.length);

    try {
      const res = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: maxSelect,
      });

      if (res.assets && res.assets.length > 0) {
        await processAndAddAssets(res.assets);
      }
    } catch {
      Alert.alert('Gallery Error', 'Could not open photo gallery. Please try again.');
    }
  }, [images.length, processAndAddAssets]);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const submitReview = useCallback(async (): Promise<boolean> => {
    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating between 1 and 5.');
      return false;
    }
    if (feedback.length > 500) {
      setError('Feedback text cannot exceed 500 characters.');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const mediaUrls = images
        .map((img) => img.uploadedUrl || img.uri)
        .filter(Boolean);

      const payload = {
        rating,
        feedback: feedback.trim() || undefined,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      };

      const res = await reviewsApi.submitReview(jobId, jobType, payload);
      if (res.success) {
        if (onSuccess) {
          onSuccess();
        }
        return true;
      } else {
        const errMsg = res.error?.message || res.message || 'Failed to submit review.';
        setError(errMsg);
        return false;
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to submit review. Please try again.';
      setError(errMsg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [jobId, jobType, rating, feedback, images, onSuccess]);

  return {
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
  };
};
