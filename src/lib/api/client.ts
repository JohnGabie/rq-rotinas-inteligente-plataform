import { getApiUrl } from './config';
import { ApiResponse } from './types';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const getAuthToken = (): string | null => {
  const session = localStorage.getItem('rotina-inteligente-session');
  if (session) {
    try {
      const parsed = JSON.parse(session);
      return parsed.token || null;
    } catch {
      return null;
    }
  }
  return null;
};

const createHeaders = (includeAuth: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

export const apiClient = {
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(getApiUrl(endpoint), {
        method: 'GET',
        headers: createHeaders(),
      });
      
      if (!response.ok) {
        throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Network error' };
    }
  },
  
  async post<T, B = unknown>(endpoint: string, body?: B, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: createHeaders(includeAuth),
        body: body ? JSON.stringify(body) : undefined,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(response.status, errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Network error' };
    }
  },
  
  async put<T, B = unknown>(endpoint: string, body?: B): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(getApiUrl(endpoint), {
        method: 'PUT',
        headers: createHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      
      if (!response.ok) {
        throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Network error' };
    }
  },
  
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(getApiUrl(endpoint), {
        method: 'DELETE',
        headers: createHeaders(),
      });
      
      if (!response.ok) {
        throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Network error' };
    }
  },
};

export { ApiError };
