/**
 * @file amcApi.ts
 * @layer Infrastructure / API
 * @responsibility Annual Maintenance Contract (AMC) plan discovery & purchasing API endpoints.
 */

import { axiosInstance } from './axiosInstance';
import { ApiResponse, AmcPlan, BuyAmcRequest, AmcSubscription } from '@core/types/api';

export const amcApi = {
  getPlans: async (): Promise<ApiResponse<AmcPlan[]>> => {
    return await axiosInstance.get<any, ApiResponse<AmcPlan[]>>(
      '/v1/customers/amc/plans'
    );
  },

  buyPlan: async (payload: BuyAmcRequest): Promise<ApiResponse<AmcSubscription>> => {
    return await axiosInstance.post<any, ApiResponse<AmcSubscription>>(
      '/v1/customers/amc/buy',
      payload
    );
  },

  getMySubscriptions: async (): Promise<ApiResponse<AmcSubscription[]>> => {
    return await axiosInstance.get<any, ApiResponse<AmcSubscription[]>>(
      '/v1/customers/amc/my-subscriptions'
    );
  },
};
