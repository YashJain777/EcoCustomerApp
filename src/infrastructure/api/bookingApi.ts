/**
 * @file bookingApi.ts
 * @layer Infrastructure / API
 * @responsibility Shopkeeper discovery, service booking, and reschedule lifecycle API endpoints.
 */

import { axiosInstance } from './axiosInstance';
import {
  ApiResponse,
  AvailableShop,
  AvailableMechanic,
  CreateBookingRequest,
  DirectFreelancerBookingRequest,
  BookingDetails,
  ProductCategory,
  PaginatedCategories,
  ServiceTypeItem,
} from '@core/types/api';

export const bookingApi = {
  getCategories: async (params?: {
    page?: number;
    limit?: number;
    pageSize?: number;
    q?: string;
  }): Promise<ApiResponse<PaginatedCategories>> => {
    try {
      const cleanParams: Record<string, any> = {};
      if (params?.page) cleanParams.page = params.page;
      if (params?.limit || params?.pageSize) cleanParams.limit = params.limit || params.pageSize;
      if (params?.q) cleanParams.q = params.q.trim();

      const res = await axiosInstance.get<any, ApiResponse<any>>('/v1/customers/categories', {
        params: Object.keys(cleanParams).length > 0 ? cleanParams : undefined,
      });
      const responseData = res?.data || res;
      const rawItems = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData?.items)
        ? responseData.items
        : Array.isArray(responseData?.data)
        ? responseData.data
        : [];

      const mappedItems: ProductCategory[] = rawItems.map((cat: any) => ({
        id: cat.id,
        name: (cat.name || 'Appliance').trim(),
        description: cat.description || undefined,
        image: cat.image || undefined,
        icon: cat.icon || undefined,
        active: cat.active !== undefined ? Boolean(cat.active) : true,
      }));

      const total = typeof responseData?.total === 'number' ? responseData.total : mappedItems.length;
      const page = typeof responseData?.page === 'number' ? responseData.page : (params?.page || 1);
      const limit = typeof responseData?.limit === 'number' ? responseData.limit : (params?.limit || mappedItems.length || 10);
      const hasMore = typeof responseData?.hasMore === 'boolean'
        ? responseData.hasMore
        : page * limit < total;

      return {
        success: true,
        data: {
          items: mappedItems,
          total,
          page,
          limit,
          hasMore,
        },
      };
    } catch (_e) {
      // Fall back gracefully
    }
    return {
      success: true,
      data: {
        items: [],
        total: 0,
        page: 1,
        limit: params?.limit || 10,
        hasMore: false,
      },
    };
  },

  getAvailableShops: async (params?: {
    categoryId?: string;
    serviceTypeId?: string;
    cityId?: string;
    saleItemId?: string;
  }): Promise<ApiResponse<AvailableShop[]>> => {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.categoryId) cleanParams.categoryId = params.categoryId;
      if (params?.serviceTypeId) cleanParams.serviceTypeId = params.serviceTypeId;
      if (params?.cityId) cleanParams.cityId = params.cityId;
      if (params?.saleItemId) cleanParams.saleItemId = params.saleItemId;

      const res = await axiosInstance.get<any, ApiResponse<any>>(
        '/v1/customers/services/available-shops',
        { params: Object.keys(cleanParams).length > 0 ? cleanParams : undefined }
      );
      const list = res?.data || res;
      const items = Array.isArray(list) ? list : list?.data;
      if (Array.isArray(items)) {
        return {
          success: true,
          data: items.map((item: any) => ({
            id: item.shopkeeperId || item.id,
            shopName: item.shopName || item.ownerName || 'Authorized Service Center',
            rating: item.rating !== undefined ? Number(item.rating) : undefined,
            serviceArea: item.city || item.serviceArea || undefined,
            offeredPrice: item.offeredPrice !== undefined ? Number(item.offeredPrice) : (item.price !== undefined ? Number(item.price) : undefined),
            isAvailable: item.isAvailable !== undefined ? Boolean(item.isAvailable) : true,
          })),
        };
      }
    } catch (_e) {
      // Fall back gracefully
    }
    return {
      success: true,
      data: [],
    };
  },

  createBooking: async (payload: CreateBookingRequest): Promise<ApiResponse<BookingDetails>> => {
    return await axiosInstance.post<any, ApiResponse<BookingDetails>>(
      '/v1/customers/bookings',
      payload
    );
  },

  bookDirectFreelancer: async (
    payload: DirectFreelancerBookingRequest
  ): Promise<ApiResponse<BookingDetails>> => {
    return await axiosInstance.post<any, ApiResponse<BookingDetails>>(
      '/v1/customers/bookings/direct-freelancer',
      payload
    );
  },

  getBookings: async (): Promise<ApiResponse<BookingDetails[]>> => {
    return await axiosInstance.get<any, ApiResponse<BookingDetails[]>>(
      '/v1/customers/bookings'
    );
  },

  getBookingById: async (id: string): Promise<ApiResponse<BookingDetails>> => {
    return await axiosInstance.get<any, ApiResponse<BookingDetails>>(
      `/v1/customers/bookings/${id}`
    );
  },

  rescheduleBooking: async (
    id: string,
    scheduledAt: string
  ): Promise<ApiResponse<BookingDetails>> => {
    return await axiosInstance.patch<any, ApiResponse<BookingDetails>>(
      `/v1/customers/bookings/${id}/reschedule`,
      { scheduledAt }
    );
  },

  getComplaintTypes: async (): Promise<ApiResponse<Array<{ id: string; label: string; serviceTypeId?: string }>>> => {
    try {
      const res = await axiosInstance.get<any, ApiResponse<any>>('/v1/masters/complaint-types');
      const list = res?.data || res;
      const items = Array.isArray(list) ? list : list?.data;
      if (Array.isArray(items) && items.length > 0) {
        return {
          success: true,
          data: items.map((item: any) => ({
            id: item.id,
            label: item.name || item.label || item.title || 'General Maintenance & Checkup',
            serviceTypeId: item.serviceTypeId || undefined,
          })),
        };
      }
    } catch (_e) {
      // Ignore fallback gracefully
    }
    return {
      success: true,
      data: [],
    };
  },

  getServiceTypes: async (params?: {
    categoryId?: string;
    cityId?: string;
  }): Promise<ApiResponse<Array<{ id: string; name: string; description?: string; image?: string; categoryId?: string; active?: boolean }>>> => {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.categoryId && !params.categoryId.startsWith('cat-')) {
        cleanParams.categoryId = params.categoryId;
      }
      if (params?.cityId) {
        cleanParams.cityId = params.cityId;
      }

      const url = cleanParams.categoryId ? '/v1/customers/service-types' : '/v1/masters/service-types';
      const res = await axiosInstance.get<any, ApiResponse<any>>(url, {
        params: Object.keys(cleanParams).length > 0 ? cleanParams : undefined,
      });
      const list = res?.data || res;
      const items = Array.isArray(list) ? list : list?.data;
      if (Array.isArray(items)) {
        return {
          success: true,
          data: items.map((item: any) => ({
            id: item.id,
            name: item.name || 'General Service',
            description: item.description || undefined,
            image: item.image || undefined,
            categoryId: item.categoryId || undefined,
            active: item.active !== undefined ? Boolean(item.active) : true,
          })),
        };
      }
    } catch (_e) {
      // Ignore fallback gracefully
    }
    return {
      success: true,
      data: [],
    };
  },

  getAvailableFreelancers: async (params?: {
    categoryId?: string;
    serviceTypeId?: string;
    cityId?: string;
  }): Promise<ApiResponse<AvailableMechanic[]>> => {
    try {
      const cleanParams: Record<string, string> = {};
      if (params?.categoryId && !params.categoryId.startsWith('cat-')) {
        cleanParams.categoryId = params.categoryId;
      }
      if (params?.serviceTypeId && !params.serviceTypeId.startsWith('st-')) {
        cleanParams.serviceTypeId = params.serviceTypeId;
      }
      if (params?.cityId) {
        cleanParams.cityId = params.cityId;
      }

      const res = await axiosInstance.get<any, ApiResponse<any>>(
        '/v1/customers/services/available-freelancers',
        { params: Object.keys(cleanParams).length > 0 ? cleanParams : undefined }
      );
      const list = res?.data || res;
      const items = Array.isArray(list) ? list : list?.data;
      if (Array.isArray(items)) {
        return {
          success: true,
          data: items.map((m: any) => ({
            id: m.id,
            name: m.name || m.user?.fullName || m.fullName || 'Freelance Specialist',
            rating: m.rating !== undefined ? Number(m.rating) : undefined,
            specialization: m.specialization || m.designation || 'Certified Technician',
            experienceYears: m.experienceYears !== undefined ? Number(m.experienceYears) : undefined,
            offeredPrice: m.offeredPrice !== undefined ? Number(m.offeredPrice) : (m.price !== undefined ? Number(m.price) : undefined),
            isAvailable: m.isAvailable !== undefined ? Boolean(m.isAvailable) : true,
          })),
        };
      }
    } catch (_e) {
      // Ignore fallback gracefully
    }
    return {
      success: true,
      data: [],
    };
  },

  cancelBooking: async (id: string): Promise<ApiResponse<BookingDetails>> => {
    return await axiosInstance.patch<any, ApiResponse<BookingDetails>>(
      `/v1/customers/bookings/${id}/cancel`
    );
  },
};
