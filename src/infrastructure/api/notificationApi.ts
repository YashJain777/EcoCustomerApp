/**
 * @file notificationApi.ts
 * @layer Infrastructure / API
 * @responsibility Notifications and in-app alerts API endpoints.
 */

import { axiosInstance } from './axiosInstance';
import { ApiResponse, NotificationItem } from '@core/types/api';

export const notificationApi = {
  getNotifications: async (): Promise<ApiResponse<NotificationItem[]>> => {
    return await axiosInstance.get<any, ApiResponse<NotificationItem[]>>(
      '/v1/notifications/my'
    );
  },

  markAsRead: async (id: string): Promise<ApiResponse<{ id: string; read: boolean }>> => {
    return await axiosInstance.post<any, ApiResponse<{ id: string; read: boolean }>>(
      `/v1/notifications/${id}/read`
    );
  },

  markAllAsRead: async (): Promise<ApiResponse<{ count: number }>> => {
    return await axiosInstance.post<any, ApiResponse<{ count: number }>>(
      '/v1/notifications/read-all'
    );
  },
};
