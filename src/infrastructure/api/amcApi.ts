/**
 * @file amcApi.ts
 * @layer Infrastructure / API
 * @responsibility Annual Maintenance Contract (AMC) plan discovery, purchasing, payment verification, and subscription tracking.
 */

import { axiosInstance } from './axiosInstance';
import { ApiResponse } from '@core/types/api';
import {
  LocalAmcPlan,
  MyAmcPlan,
  FetchLocalPlansFilters,
  PurchaseAmcRequest,
  VerifyAmcPaymentRequest,
  ClaimAmcRequest,
} from '@core/types/amc.types';

export const amcApi = {
  /**
   * Fetch local AMC plans within proximity radius filtered by GPS and category
   */
  getLocalPlans: async (
    filters?: FetchLocalPlansFilters
  ): Promise<ApiResponse<LocalAmcPlan[]>> => {
    try {
      return await axiosInstance.get<any, ApiResponse<LocalAmcPlan[]>>(
        '/v1/customers/amc/local-plans',
        { params: filters }
      );
    } catch (_e) {
      // Fallback endpoint if local-plans is unavailable
      return await axiosInstance.get<any, ApiResponse<LocalAmcPlan[]>>(
        '/v1/customers/amc/plans',
        { params: filters }
      );
    }
  },

  /**
   * Purchase an AMC plan
   */
  purchasePlan: async (
    payload: PurchaseAmcRequest
  ): Promise<ApiResponse<MyAmcPlan>> => {
    try {
      return await axiosInstance.post<any, ApiResponse<MyAmcPlan>>(
        '/v1/customers/amc/purchase',
        payload
      );
    } catch (_e) {
      // Fallback endpoint
      return await axiosInstance.post<any, ApiResponse<MyAmcPlan>>(
        '/v1/customers/amc/buy',
        payload
      );
    }
  },

  /**
   * Verify AMC payment transaction
   */
  verifyPayment: async (
    payload: VerifyAmcPaymentRequest
  ): Promise<ApiResponse<MyAmcPlan>> => {
    return await axiosInstance.post<any, ApiResponse<MyAmcPlan>>(
      '/v1/customers/amc/verify-payment',
      payload
    );
  },

  /**
   * Fetch all AMC plans subscribed by the authenticated customer
   */
  getMyPlans: async (): Promise<ApiResponse<MyAmcPlan[]>> => {
    try {
      const res = await axiosInstance.get<any, ApiResponse<MyAmcPlan[]>>(
        '/v1/customers/amc/my-plans'
      );
      if (res?.data) return res;
      return await axiosInstance.get<any, ApiResponse<MyAmcPlan[]>>(
        '/v1/customers/amc/my-subscriptions'
      );
    } catch (_e) {
      return await axiosInstance.get<any, ApiResponse<MyAmcPlan[]>>(
        '/v1/customers/amc/my-subscriptions'
      );
    }
  },

  /**
   * Claim an AMC visit / service request under an active AMC subscription
   */
  claimAmc: async (
    payload: ClaimAmcRequest
  ): Promise<ApiResponse<any>> => {
    return await axiosInstance.post<any, ApiResponse<any>>(
      '/v1/customers/amc/claim',
      payload
    );
  },

  // Backward-compatibility aliases
  getPlans: async (): Promise<ApiResponse<LocalAmcPlan[]>> => {
    return amcApi.getLocalPlans();
  },
  buyPlan: async (payload: PurchaseAmcRequest): Promise<ApiResponse<MyAmcPlan>> => {
    return amcApi.purchasePlan(payload);
  },
  getMySubscriptions: async (): Promise<ApiResponse<MyAmcPlan[]>> => {
    return amcApi.getMyPlans();
  },
};
