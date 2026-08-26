
/**
 * @file reviewsApi.ts
 * @feature Reviews / API
 * @responsibility Endpoints for customer review submissions and retrieving customer review history.
 */

import { axiosInstance } from '@infrastructure/api/axiosInstance';
import { ApiResponse } from '@core/types/api';
import {
  JobType,
  SubmitReviewPayload,
  PaginatedReviewsResponse,
  ReviewItem,
} from '../types/reviews.types';

export const reviewsApi = {
  /**
   * Submit a review for a completed service job or installation.
   * POST /v1/customers/jobs/:jobId/review
   */
  submitReview: async (
    jobId: string,
    type: JobType,
    payload: SubmitReviewPayload,
  ): Promise<ApiResponse<ReviewItem>> => {
    const formattedType: 'JOB' | 'INSTALLATION' =
      type === 'INSTALLATION' ? 'INSTALLATION' : 'JOB';
    const body: Record<string, any> = {
      type: formattedType,
      rating: payload.rating,
    };
    if (payload.feedback && payload.feedback.trim()) {
      body.feedback = payload.feedback.trim();
    }
    if (Array.isArray(payload.mediaUrls) && payload.mediaUrls.length > 0) {
      body.mediaUrls = payload.mediaUrls.filter(Boolean);
    }
    return await axiosInstance.post<any, ApiResponse<ReviewItem>>(
      `/v1/customers/jobs/${jobId}/review`,
      body,
      { params: { type: formattedType } },
    );
  },

  /**
   * Get a paginated list of reviews submitted by the authenticated customer.
   * GET /v1/customers/reviews?page=:page&pageSize=:pageSize
   */
  getMyReviews: async (
    page: number = 1,
    pageSize: number = 20,
  ): Promise<ApiResponse<PaginatedReviewsResponse>> => {
    return await axiosInstance.get<any, ApiResponse<PaginatedReviewsResponse>>(
      '/v1/customers/reviews',
      { params: { page, pageSize } },
    );
  },
};
