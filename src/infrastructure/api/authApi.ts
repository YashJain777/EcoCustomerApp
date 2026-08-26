/**
 * @file authApi.ts
 * @layer Infrastructure / API
 * @responsibility Authentication, OTP verification, and role selection API calls.
 */

import { axiosInstance, setAuthToken } from './axiosInstance';
import {
  ApiResponse,
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  RegisterCustomerRequest,
  CustomerProfile,
  GeneralVerifyOtpRequest,
  GeneralVerifyOtpResponse,
} from '@core/types/api';

export const authApi = {
  // Send OTP for login. Throws error if no account exists.
  sendOtp: async (payload: SendOtpRequest): Promise<ApiResponse<SendOtpResponse>> => {
    return await axiosInstance.post<any, ApiResponse<SendOtpResponse>>(
      '/v2/auth/otp/request',
      { mobile: payload.mobile, purpose: payload.purpose || 'LOGIN' }
    );
  },

  // Send OTP for new customer registration
  sendRegistrationOtp: async (payload: SendOtpRequest): Promise<ApiResponse<SendOtpResponse>> => {
    return await axiosInstance.post<any, ApiResponse<SendOtpResponse>>(
      '/v2/customers/send-otp',
      payload
    );
  },

  verifyOtp: async (payload: VerifyOtpRequest): Promise<ApiResponse<VerifyOtpResponse>> => {
    return await axiosInstance.post<any, ApiResponse<VerifyOtpResponse>>(
      '/v2/customers/verify-otp',
      payload
    );
  },

  loginVerifyOtp: async (
    payload: GeneralVerifyOtpRequest
  ): Promise<ApiResponse<GeneralVerifyOtpResponse>> => {
    const otpCode = payload.code || payload.otpCode || '';
    const response = await axiosInstance.post<any, ApiResponse<GeneralVerifyOtpResponse>>(
      '/v2/auth/otp/verify',
      { mobile: payload.mobile, code: otpCode }
    );
    const token = response?.data?.token || response?.data?.accessToken;
    if (token) {
      setAuthToken(token);
    }
    return response;
  },

  register: async (payload: RegisterCustomerRequest): Promise<ApiResponse<CustomerProfile>> => {
    return await axiosInstance.post<any, ApiResponse<CustomerProfile>>(
      '/v2/customers/register',
      payload
    );
  },

  selectRole: async (role = 'CUSTOMER'): Promise<ApiResponse<{ role: string }>> => {
    return await axiosInstance.post<any, ApiResponse<{ role: string }>>(
      '/v1/auth/select-role',
      { role }
    );
  },
};
