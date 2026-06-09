/* ===================================================
   ubicar.ar — API Client
   =================================================== */

import { API_BASE_URL } from '../config';
import type { ApiError } from '../types';

/** Get stored auth token */
function getToken(): string | null {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

/** Custom error for API failures */
export class ApiRequestError extends Error {
  status: number;
  details?: ApiError['details'];

  constructor(message: string, status: number, details?: ApiError['details']) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.details = details;
  }
}

/** Core API request function */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = { ...options.headers as Record<string, string> };

  // Add auth header if token exists
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // Add JSON content-type for non-FormData bodies
  if (options.body && !(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 — auto logout
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('auth:logout'));
    throw new ApiRequestError('Sesión expirada', 401);
  }

  // Handle non-OK responses
  if (!response.ok) {
    let errorData: ApiError = { error: 'Error del servidor' };
    try {
      errorData = await response.json() as ApiError;
    } catch {
      // Response wasn't JSON
    }
    throw new ApiRequestError(
      errorData.error || `Error ${response.status}`,
      response.status,
      errorData.details
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/** API convenience methods */
export const api = {
  get<T>(endpoint: string): Promise<T> {
    return apiRequest<T>(endpoint, { method: 'GET' });
  },

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete<T>(endpoint: string): Promise<T> {
    return apiRequest<T>(endpoint, { method: 'DELETE' });
  },

  upload<T>(endpoint: string, formData: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
    return apiRequest<T>(endpoint, {
      method,
      body: formData,
    });
  },
};
