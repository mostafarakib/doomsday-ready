export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Resolves an endpoint path against the configured API base URL (VITE_API_URL).
 * Standardizes on VITE_API_URL as the sole environment variable.
 * Handles:
 * - base URL with or without trailing slash (e.g. 'https://api.render.com/' vs 'https://api.render.com')
 * - base URL with or without '/api' suffix (e.g. 'https://api.render.com/api' vs 'https://api.render.com')
 * - existing API endpoints beginning with '/api/' without producing duplicate '/api/api'
 * - falls back to relative endpoint when VITE_API_URL is absent (for local Vite dev proxy)
 */
export function buildApiUrl(endpoint: string, baseUrlOverride?: string): string {
  const rawBase = (
    baseUrlOverride !== undefined
      ? baseUrlOverride
      : (import.meta.env.VITE_API_URL as string | undefined) || ''
  ).trim();

  if (!rawBase) {
    return endpoint;
  }

  const base = rawBase.replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If base already ends with /api and path starts with /api/, avoid duplicate /api/api
  if (base.endsWith('/api') && path.startsWith('/api/')) {
    return `${base}${path.slice(4)}`;
  }
  if (base.endsWith('/api') && path === '/api') {
    return base;
  }

  return `${base}${path}`;
}

/**
 * Standard API request wrapper that parses JSON envelopes and handles errors consistently.
 */
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = buildApiUrl(endpoint);
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err;
    }
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      err instanceof Error ? err.message : 'Network error. Please check backend server connection.',
    );
  }

  let body: ApiSuccessResponse<T> | ApiErrorResponse | null = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON response or empty body
  }

  if (!response.ok || !body || !body.success) {
    const errorDetail = body && !body.success ? (body as ApiErrorResponse).error : undefined;
    const code = errorDetail?.code || (response.status === 404 ? 'NOT_FOUND' : 'API_ERROR');
    const message =
      errorDetail?.message ||
      `Request failed with status ${response.status} (${response.statusText || 'Error'})`;

    throw new ApiError(response.status, code, message);
  }

  return body.data;
}
