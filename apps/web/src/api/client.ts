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
 * Standard API request wrapper that parses JSON envelopes and handles errors consistently.
 */
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch (err) {
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
