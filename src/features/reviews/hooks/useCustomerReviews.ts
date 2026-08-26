/**
 * @file useCustomerReviews.ts
 * @feature Reviews / Hooks
 * @responsibility Data fetching, pagination, and refresh logic for customer review history.
 */

import { useState, useCallback, useEffect } from 'react';
import { ReviewItem } from '../types/reviews.types';
import { reviewsApi } from '../api/reviewsApi';

export interface UseCustomerReviewsReturn {
  reviews: ReviewItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  retry: () => void;
}

export const useCustomerReviews = (initialPageSize: number = 20): UseCustomerReviewsReturn => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const fetchReviews = useCallback(
    async (targetPage: number, isRefreshAction: boolean = false) => {
      if (isRefreshAction) {
        setIsRefreshing(true);
      } else if (targetPage > 1) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const res = await reviewsApi.getMyReviews(targetPage, initialPageSize);
        const payload: any = (res as any)?.data?.items ? (res as any).data : ((res as any)?.items ? res : (res as any)?.data);
        if (res.success || payload?.items) {
          const items = payload?.items || (Array.isArray(payload) ? payload : []);
          if (targetPage === 1) {
            setReviews(items);
          } else {
            setReviews((prev) => [...prev, ...items]);
          }
          setPage(payload?.page ?? targetPage);
          setTotalPages(payload?.totalPages ?? 1);
          setTotal(payload?.total ?? items.length);
        } else {
          setError(res.error?.message || res.message || 'Failed to load reviews.');
        }
      } catch (err: any) {
        const errMsg =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load reviews. Please check your network connection.';
        setError(errMsg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [initialPageSize],
  );

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  const refresh = useCallback(async () => {
    await fetchReviews(1, true);
  }, [fetchReviews]);

  const loadMore = useCallback(async () => {
    if (!isLoadingMore && !isLoading && page < totalPages) {
      await fetchReviews(page + 1);
    }
  }, [isLoadingMore, isLoading, page, totalPages, fetchReviews]);

  const retry = useCallback(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  return {
    reviews,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    page,
    totalPages,
    total,
    refresh,
    loadMore,
    retry,
  };
};
