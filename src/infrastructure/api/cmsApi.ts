/**
 * @file cmsApi.ts
 * @layer Infrastructure / API
 * @responsibility Fetch CMS static pages and content entries from backend endpoints.
 */

import { axiosInstance } from './axiosInstance';
import { ApiResponse } from '@core/types/api';

export interface CmsStaticPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CmsContentEntry {
  id: string;
  contentTypeId?: string;
  status: string;
  data: {
    question?: string;
    answer?: string;
    key?: string;
    title?: string;
    description?: string;
    [key: string]: any;
  };
  createdAt?: string;
  updatedAt?: string;
}

export const cmsApi = {
  getPageBySlug: async (slug: string = 'customer-terms-conditions'): Promise<ApiResponse<CmsStaticPage>> => {
    return await axiosInstance.get<any, ApiResponse<CmsStaticPage>>(
      `/v2/static-pages/${slug}`
    );
  },

  getContentEntries: async (
    type: string = 'faq',
    key: string = 'customer'
  ): Promise<ApiResponse<CmsContentEntry[]>> => {
    return await axiosInstance.get<any, ApiResponse<CmsContentEntry[]>>(
      '/v2/content-manager',
      { params: { type, key } }
    );
  },
};
