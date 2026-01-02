import { getApiUrl } from './config';
import { ApiResponse } from './types';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Map detailed errors to user-friendly messages
const sanitizeErrorMessage = (status: number, _rawMessage?: string): string => {
  switch (status) {
    case 400:
      return 'Dados inválidos. Verifique as informações e tente novamente.';
    case 401:
      return 'Sessão expirada. Faça login novamente.';
    case 403:
      return 'Você não tem permissão para realizar esta ação.';
    case 404:
      return 'Recurso não encontrado.';
    case 422:
      return 'Dados inválidos. Verifique as informações e tente novamente.';
    case 429:
      return 'Muitas tentativas. Aguarde um momento e tente novamente.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Erro no servidor. Tente novamente mais tarde.';
    default:
      return 'Ocorreu um erro. Tente novamente.';
  }
};

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
        throw new ApiError(response.status, sanitizeErrorMessage(response.status));
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Erro de conexão. Verifique sua internet.' };
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
        throw new ApiError(response.status, sanitizeErrorMessage(response.status));
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Erro de conexão. Verifique sua internet.' };
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
        throw new ApiError(response.status, sanitizeErrorMessage(response.status));
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Erro de conexão. Verifique sua internet.' };
    }
  },
  
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(getApiUrl(endpoint), {
        method: 'DELETE',
        headers: createHeaders(),
      });
      
      if (!response.ok) {
        throw new ApiError(response.status, sanitizeErrorMessage(response.status));
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Erro de conexão. Verifique sua internet.' };
    }
  },
};

export { ApiError };
