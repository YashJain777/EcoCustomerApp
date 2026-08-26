/**
 * @file env.ts
 * @layer Core / Config
 * @responsibility
 *   Single source of truth for all environment-specific configuration.
 *   Add new env vars here — never read process.env outside this file.
 */

const getBaseUrl = () => {
  // Live Staging URL (Uncomment to connect to production/staging server):
  return 'https://ecosystemback.idea2reality.tech/api';

  // Local Backend URL:
  // For physical Android devices via USB (with 'adb reverse tcp:4000 tcp:4000') and iOS/Web
  // return 'http://localhost:4000/api';
};

export const  ENV = {
  // API
  API_BASE_URL: getBaseUrl(),
  API_TIMEOUT: 30_000, // 30 seconds

  // Media / Uploads server base URL (where category/product images reside)
  MEDIA_BASE_URL: 'https://ecosystemback.idea2reality.tech',

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: 'smart-sales',
  CLOUDINARY_UPLOAD_PRESET: 'smart_sales_preset',

  // Google Maps
  GOOGLE_MAPS_API_KEY: '',

  // Firebase
  FIREBASE_PROJECT_ID: 'smart-sales-app',

  // App
  APP_VERSION: '1.0.0',
  BUILD_NUMBER: '1',

  // Feature flags
  ENABLE_OFFLINE_MODE: true,
  ENABLE_BIOMETRICS: true,
  ENABLE_ANALYTICS: true,
  ENABLE_CRASH_REPORTING: true,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Cache TTL (milliseconds)
  CACHE_TTL_SHORT: 5 * 60 * 1000,    // 5 minutes
  CACHE_TTL_MEDIUM: 30 * 60 * 1000,  // 30 minutes
  CACHE_TTL_LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

export type EnvConfig = typeof ENV;
