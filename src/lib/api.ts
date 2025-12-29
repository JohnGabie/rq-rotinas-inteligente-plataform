import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { AuthTokens, ApiResponse, User, Device, MonitoringStatus, MonitoringStartRequest, DeviceControlRequest } from '@/types';

// API Base URL from environment or default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Token storage keys
const TOKEN_KEY = 'ri_auth_tokens';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Token management
export const getStoredTokens = (): AuthTokens | null => {
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return null;
    
    const tokens: AuthTokens = JSON.parse(stored);
    
    // Check if token is expired
    if (tokens.expiresAt && Date.now() > tokens.expiresAt) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    
    return tokens;
  } catch {
    return null;
  }
};

export const storeTokens = (tokens: AuthTokens): void => {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
};

export const clearTokens = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// Check last activity for auto logout
let lastActivity = Date.now();

export const updateActivity = (): void => {
  lastActivity = Date.now();
};

export const checkInactivity = (): boolean => {
  return Date.now() - lastActivity > INACTIVITY_TIMEOUT;
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = getStoredTokens();
    
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    
    updateActivity();
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config;
    
    // Handle 401 - redirect to login
    if (error.response?.status === 401) {
      clearTokens();
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Handle other errors
    const errorMessage = error.response?.data?.error || error.message || 'Erro desconhecido';
    
    return Promise.reject(new Error(errorMessage));
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string, recaptchaToken?: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> => {
    const response = await api.post('/api/auth/login', { email, password, recaptchaToken });
    return response.data;
  },
  
  logout: async (): Promise<ApiResponse<void>> => {
    const response = await api.post('/api/auth/logout');
    clearTokens();
    return response.data;
  },
  
  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
  
  refreshToken: async (refreshToken: string): Promise<ApiResponse<AuthTokens>> => {
    const response = await api.post('/api/auth/refresh', { refreshToken });
    return response.data;
  },
};

// Devices API
export const devicesApi = {
  getAll: async (): Promise<ApiResponse<Device[]>> => {
    const response = await api.get('/api/devices');
    return response.data;
  },
  
  controlSnmpOutlet: async (outletNumber: number, request: DeviceControlRequest): Promise<ApiResponse<Device>> => {
    const response = await api.post(`/api/snmp/outlet/${outletNumber}`, request);
    return response.data;
  },
  
  controlTuyaDevice: async (deviceId: string, request: DeviceControlRequest): Promise<ApiResponse<Device>> => {
    const response = await api.post(`/api/tuya/device/${deviceId}`, request);
    return response.data;
  },
};

// Monitoring API
export const monitoringApi = {
  start: async (config: MonitoringStartRequest): Promise<ApiResponse<MonitoringStatus>> => {
    const response = await api.post('/api/monitoring/start', config);
    return response.data;
  },
  
  stop: async (): Promise<ApiResponse<void>> => {
    const response = await api.post('/api/monitoring/stop');
    return response.data;
  },
  
  getStatus: async (): Promise<ApiResponse<MonitoringStatus>> => {
    const response = await api.get('/api/monitoring/status');
    return response.data;
  },
};

export default api;
