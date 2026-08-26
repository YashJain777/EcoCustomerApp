import axios from 'axios';
import { createMMKV } from 'react-native-mmkv';
import { ENV } from '@core/config/env';

const storage = createMMKV();
const TOKEN_KEY = 'CUSTOMER_AUTH_TOKEN';

// Restore token from persistent MMKV storage on app boot
let authToken: string | null = storage.getString(TOKEN_KEY) || null;

export const axiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    storage.set(TOKEN_KEY, token);
  } else {
    storage.remove(TOKEN_KEY);
  }
};

export const getAuthToken = (): string | null => {
  return authToken || storage.getString(TOKEN_KEY) || null;
};

// Request interceptor to attach Bearer token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const currentToken = getAuthToken();
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to unwrap data and handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data;
    const status = error.response?.status;
    let errorResponse: any;

    if (errorData && typeof errorData === 'object') {
      errorResponse = { ...errorData };
    } else if (errorData) {
      errorResponse = { success: false, error: String(errorData) };
    } else {
      errorResponse = {
        success: false,
        error: { code: 'NETWORK_ERROR', message: error?.message || 'Unable to connect to service server' },
      };
    }

    // Normalize error properties for seamless handling across screens
    errorResponse.status = status;
    if (typeof errorResponse.error === 'string') {
      errorResponse.message = errorResponse.error;
    } else if (errorResponse.error?.message) {
      errorResponse.message = errorResponse.error.message;
    } else if (errorResponse.message && !errorResponse.error) {
      errorResponse.error = errorResponse.message;
    }

    return Promise.reject(errorResponse);
  }
);
