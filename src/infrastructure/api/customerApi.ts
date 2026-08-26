/**
 * @file customerApi.ts
 * @layer Infrastructure / API
 * @responsibility Customer profile, multi-address, and location management endpoints.
 */

import { axiosInstance } from './axiosInstance';
import { ApiResponse, CustomerProfile, UpdateProfileRequest } from '@core/types/api';

export interface LocationItem {
  id: string;
  name: string;
  code?: string;
  stateId?: string;
}

export interface CustomerAddress {
  id?:          string;
  customerId?:  string;
  label?:       string;
  houseNo?:     string;
  street?:      string;
  landmark?:    string;
  address?:     string;
  countryId?:   string;
  countryName?: string;
  stateId?:     string;
  stateName?:   string;
  cityId?:      string;
  cityName?:    string;
  pinCode?:     string;
  latitude?:    number;
  longitude?:   number;
  addressType?: 'HOME' | 'WORK' | 'OFFICE' | 'OTHER';
  isDefault?:   boolean;
  createdAt?:   string;
  updatedAt?:   string;
}

export type CreateAddressPayload = Omit<CustomerAddress, 'id' | 'customerId' | 'createdAt' | 'updatedAt'> & {
  pinCode: string; // required on create
};

export type UpdateAddressPayload = Omit<CustomerAddress, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>;

export const customerApi = {
  // ── Profile ────────────────────────────────────────────────────────────────
  getProfile: async (): Promise<ApiResponse<CustomerProfile>> => {
    return await axiosInstance.get<any, ApiResponse<CustomerProfile>>('/v1/customers/profile');
  },

  updateProfile: async (payload: UpdateProfileRequest): Promise<ApiResponse<CustomerProfile>> => {
    return await axiosInstance.put<any, ApiResponse<CustomerProfile>>('/v1/customers/profile', payload);
  },
 
  // ── Addresses (Multi-Address CRUD) ─────────────────────────────────────────
  getAddresses: async (): Promise<ApiResponse<CustomerAddress[]>> => {
    return await axiosInstance.get<any, ApiResponse<CustomerAddress[]>>('/v1/customers/addresses');
  },

  createAddress: async (payload: CreateAddressPayload): Promise<ApiResponse<CustomerAddress>> => {
    return await axiosInstance.post<any, ApiResponse<CustomerAddress>>('/v1/customers/addresses', payload);
  },

  updateAddress: async (id: string, payload: UpdateAddressPayload): Promise<ApiResponse<CustomerAddress>> => {
    return await axiosInstance.put<any, ApiResponse<CustomerAddress>>(`/v1/customers/addresses/${id}`, payload);
  },

  setDefaultAddress: async (id: string): Promise<ApiResponse<CustomerAddress>> => {
    return await axiosInstance.patch<any, ApiResponse<CustomerAddress>>(`/v1/customers/addresses/${id}/default`);
  },

  deleteAddress: async (id: string): Promise<ApiResponse<{ deleted: boolean; id: string }>> => {
    return await axiosInstance.delete<any, ApiResponse<{ deleted: boolean; id: string }>>(`/v1/customers/addresses/${id}`);
  },

  // ── Location Cascades ──────────────────────────────────────────────────────
  getCountries: async (): Promise<ApiResponse<LocationItem[]>> => {
    return await axiosInstance.get<any, ApiResponse<LocationItem[]>>('/v2/locations/countries');
  },

  getStates: async (countryId?: string): Promise<ApiResponse<LocationItem[]>> => {
    return await axiosInstance.get<any, ApiResponse<LocationItem[]>>(
      '/v2/locations/states',
      { params: countryId ? { countryId } : undefined }
    );
  },

  getCities: async (stateId?: string): Promise<ApiResponse<LocationItem[]>> => {
    return await axiosInstance.get<any, ApiResponse<LocationItem[]>>(
      '/v2/locations/cities',
      { params: stateId ? { stateId } : undefined }
    );
  },
};
