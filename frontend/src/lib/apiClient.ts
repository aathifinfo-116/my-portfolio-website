import axios, { AxiosError } from 'axios';
import type { ApiErrorBody } from '@/types/api';

/**
 * Normalises VITE_API_BASE_URL into a bare origin.
 *
 * The two mistakes this absorbs, both of which fail confusingly:
 *
 * - A missing scheme. `my-api.vercel.app` is a *relative path*, so the browser
 *   resolves it against the page origin and requests
 *   `https://frontend.vercel.app/my-api.vercel.app/api/...`, which 404s on the
 *   frontend rather than reaching the API at all.
 * - A trailing `/api`. This module appends `/api` itself, so the value ending
 *   in `/api` would produce `/api/api/profile`.
 *
 * A value starting with `/` is left alone: that is a deliberate same-origin
 * path, which is how the Vite dev proxy is used.
 */
function normaliseApiBase(raw: string | undefined): string {
  const value = (raw ?? '').trim();
  if (!value || value.startsWith('/')) return '';

  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  return withScheme.replace(/\/+$/, '').replace(/\/api$/i, '');
}

/**
 * Empty base URL means requests go to the same origin as `/api/...`, which the
 * Vite dev proxy forwards to the Nest server. Set VITE_API_BASE_URL when the
 * frontend is deployed to a different host than the API.
 */
const baseURL = normaliseApiBase(import.meta.env.VITE_API_BASE_URL);

export const apiClient = axios.create({
  baseURL: baseURL ? `${baseURL}/api` : '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

const TOKEN_KEY = 'portfolio_admin_token';

/** Attaches the admin token when one is stored (used by the dashboard). */
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Flattens Nest's error body into a single readable string.
 * class-validator returns `message` as an array of failures.
 */
export function extractErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorBody>;

    if (axiosError.code === 'ECONNABORTED') {
      return 'The request timed out. Please check your connection.';
    }

    if (!axiosError.response) {
      return 'Could not reach the server. Is the API running?';
    }

    const body = axiosError.response.data;
    if (body?.message) {
      return Array.isArray(body.message) ? body.message[0] : body.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

/**
 * Resolves a stored file URL for display, tolerating relative paths.
 *
 * Absolute backend URLs are rewritten to their same-origin equivalent when no
 * VITE_API_BASE_URL is set, so `/static/...` goes through the Vite proxy.
 * That keeps <iframe> previews same-origin, which matters because the API
 * sends `frame-ancestors` and cross-origin embedding is otherwise refused.
 */
export function resolveFileUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const trimmedBase = baseURL;

  if (/^https?:\/\//i.test(url)) {
    if (trimmedBase) return url;

    // No explicit API origin: strip the host so the dev proxy handles it.
    try {
      const parsed = new URL(url);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return url;
    }
  }

  return `${trimmedBase}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Absolute-or-proxied URL for the API's download endpoint.
 * Used directly as an <a href> so the browser handles the save dialog and the
 * backend's Content-Disposition names the file.
 */
export function buildDownloadUrl(documentId: string): string {
  return `${apiClient.defaults.baseURL}/documents/${documentId}/download`;
}
