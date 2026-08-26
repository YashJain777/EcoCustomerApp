/**
 * @file complaintApi.ts
 * @layer Infrastructure / API
 * @responsibility Complaint ticket raising, tracking, cancellation, and reopening API endpoints.
 */

import { axiosInstance } from './axiosInstance';
import { ApiResponse, ComplaintTicket, RaiseComplaintRequest } from '@core/types/api';

export const complaintApi = {
  getComplaints: async (): Promise<ApiResponse<ComplaintTicket[]>> => {
    return await axiosInstance.get<any, ApiResponse<ComplaintTicket[]>>(
      '/v1/customers/my-services'
    );
  },

  getComplaintById: async (id: string): Promise<ApiResponse<ComplaintTicket>> => {
    return await axiosInstance.get<any, ApiResponse<ComplaintTicket>>(
      `/v1/customers/complaints/${id}`
    );
  },

  raiseComplaint: async (
    payload: RaiseComplaintRequest
  ): Promise<ApiResponse<ComplaintTicket>> => {
    return await axiosInstance.post<any, ApiResponse<ComplaintTicket>>(
      '/v1/customers/complaints',
      payload
    );
  },

  requestInstallation: async (payload: {
    saleItemId?: string;
    productName?: string;
    address?: string;
    notes?: string;
    preferredDate?: string;
  }): Promise<ApiResponse<ComplaintTicket>> => {
    return await axiosInstance.post<any, ApiResponse<ComplaintTicket>>(
      '/v1/customers/installations/request',
      payload
    );
  },

  cancelComplaint: async (id: string): Promise<ApiResponse<ComplaintTicket>> => {
    return await axiosInstance.patch<any, ApiResponse<ComplaintTicket>>(
      `/v1/customers/complaints/${id}/cancel`
    );
  },

  reopenComplaint: async (id: string): Promise<ApiResponse<ComplaintTicket>> => {
    return await axiosInstance.post<any, ApiResponse<ComplaintTicket>>(
      `/v1/customers/complaints/${id}/reopen`
    );
  },
};
