/**
 * @file reviews.types.ts
 * @feature Reviews / Types
 * @responsibility Data models and contracts for submitting and retrieving customer job reviews.
 */

export type JobType = 'JOB' | 'SERVICE_JOB' | 'INSTALLATION';

export interface SubmitReviewPayload {
  type?: 'JOB' | 'INSTALLATION' | 'SERVICE_JOB';
  rating: number;
  feedback?: string;
  mediaUrls?: string[];
}

export interface ReviewMedia {
  id: string;
  url: string;
  type: string;
}

export interface ReviewItem {
  id: string;
  type?: 'JOB' | 'INSTALLATION' | 'SERVICE_JOB';
  jobType?: JobType;
  entityId?: string;
  serviceType?: string;
  mechanicName?: string;
  description?: string;
  rating: number;
  feedback?: string;
  media?: ReviewMedia[];
  createdAt: string;
}

export interface PaginatedReviewsResponse {
  items: ReviewItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
