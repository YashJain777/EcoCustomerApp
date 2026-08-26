/**
 * @file imageUtils.ts
 * @layer Core / Utils
 * @responsibility Media and image URI resolver for local backend and remote staging assets.
 */

import { ENV } from '@core/config/env';

/**
 * Resolves a backend media/image path (relative e.g. "/uploads/categories/..." or absolute URL)
 * into a complete, fully reachable image URI.
 *
 * Automatically handles local development (localhost, 10.0.2.2, LAN IPs) and remote staging.
 *
 * @param path Relative or absolute image path from backend
 * @returns Fully qualified HTTP(S) URL or null if invalid
 */
export const resolveMediaUrl = (path?: string | null): string | null => {
  if (!path || typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (!trimmed) return null;

  // Already a full URL (http://, https://, data:, file://)
  if (/^(https?:\/\/|data:|file:\/\/)/i.test(trimmed)) {
    return trimmed;
  }

  // Relative path from backend (e.g. /uploads/categories/xyz.jpeg)
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  // Extract server origin from API_BASE_URL (e.g. "http://localhost:4000" from "http://localhost:4000/api")
  const apiOrigin = ENV.API_BASE_URL.replace(/\/api\/?$/i, '');
  const isLocalApi = /localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\./i.test(ENV.API_BASE_URL);

  const serverBase = isLocalApi
    ? apiOrigin
    : ((ENV as any).MEDIA_BASE_URL || apiOrigin);

  return `${serverBase}${cleanPath}`;
};
