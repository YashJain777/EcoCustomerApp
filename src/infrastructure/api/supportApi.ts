/**
 * @file supportApi.ts
 * @layer Infrastructure / API
 * @responsibility Customer support and inquiry submission API endpoints.
 */

import { axiosInstance } from './axiosInstance';
import { ApiResponse, SupportQueryRequest } from '@core/types/api';

export const supportApi = {
  submitQuery: async (
    payload: SupportQueryRequest
  ): Promise<ApiResponse<{ id: string; message: string }>> => {
    return await axiosInstance.post<any, ApiResponse<{ id: string; message: string }>>(
      '/v2/queries',
      payload
    );
  },
};
