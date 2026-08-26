/**
 * @file productApi.ts
 * @layer Infrastructure / API
 * @responsibility Registered appliances, QR code binding, and product document vault endpoints.
 */

import { axiosInstance } from './axiosInstance';
import {
  ApiResponse,
  CustomerProduct,
  ProductDocument,
  ScanQrRequest,
  ScanQrResponse,
} from '@core/types/api';

export const productApi = {
  getMyProducts: async (): Promise<ApiResponse<CustomerProduct[]>> => {
    return await axiosInstance.get<any, ApiResponse<CustomerProduct[]>>(
      '/v1/customers/my-products'
    );
  },

  getProductById: async (id: string): Promise<ApiResponse<CustomerProduct>> => {
    return await axiosInstance.get<any, ApiResponse<CustomerProduct>>(
      `/v1/customers/my-products/${id}`
    );
  },

  scanQr: async (payload: ScanQrRequest): Promise<ApiResponse<ScanQrResponse>> => {
    const rawCode = (payload.code ?? payload.qrCode ?? '').trim();
    let extractedCode = rawCode;
    if (extractedCode.includes('/verify/')) {
      const part = extractedCode.split('/verify/')[1]?.split('/')[0]?.split('?')[0];
      if (part) extractedCode = decodeURIComponent(part).trim();
    } else if (extractedCode.includes('/qr/')) {
      const part = extractedCode.split('/qr/')[1]?.split('/')[0]?.split('?')[0];
      if (part) extractedCode = decodeURIComponent(part).trim();
    }
    return await axiosInstance.post<any, ApiResponse<ScanQrResponse>>(
      '/v1/customers/scan-qr',
      { code: extractedCode, qrCode: rawCode }
    );
  },

  // ── Document Vault ──────────────────────────────────────────────────────────
  getProductDocuments: async (productId: string): Promise<ApiResponse<ProductDocument[]>> => {
    return await axiosInstance.get<any, ApiResponse<ProductDocument[]>>(
      `/v1/customers/my-products/${productId}/documents`
    );
  },

  uploadProductDocument: async (
    productId: string,
    file: { uri: string; name?: string; type?: string; fileName?: string },
    docType?: string
  ): Promise<ApiResponse<ProductDocument>> => {
    const formData = new FormData();
    const fileName = file.name || file.fileName || `doc_${Date.now()}.jpg`;
    const mimeType = file.type || 'image/jpeg';

    formData.append('file', {
      uri: file.uri,
      name: fileName,
      type: mimeType,
    } as any);

    if (docType) {
      formData.append('type', docType);
    }

    return await axiosInstance.post<any, ApiResponse<ProductDocument>>(
      `/v1/customers/my-products/${productId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  deleteProductDocument: async (docId: string): Promise<ApiResponse<{ deleted: boolean }>> => {
    return await axiosInstance.delete<any, ApiResponse<{ deleted: boolean }>>(
      `/v1/customers/my-products/documents/${docId}`
    );
  },
};
