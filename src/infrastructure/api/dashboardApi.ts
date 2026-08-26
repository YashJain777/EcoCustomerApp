/**
 * @file dashboardApi.ts
 * @layer Infrastructure / API
 * @responsibility Customer Dashboard metrics and overview API endpoints.
 */

import { axiosInstance } from './axiosInstance';
import { ApiResponse, CustomerDashboardData } from '@core/types/api';

export const dashboardApi = {
  getDashboard: async (): Promise<ApiResponse<CustomerDashboardData>> => {
    return await axiosInstance.get<any, ApiResponse<CustomerDashboardData>>(
      '/v1/customers/dashboard'
    );
  },
};
