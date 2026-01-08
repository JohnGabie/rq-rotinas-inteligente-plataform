// API Configuration - Change this to your FastAPI backend URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_ME: '/api/auth/me',
  
  // Devices
  DEVICES: '/api/devices',
  DEVICE_BY_ID: (id: string) => `/api/devices/${id}`,
  DEVICE_TOGGLE: (id: string) => `/api/devices/${id}/toggle`,
  DEVICES_TOGGLE_ALL: '/api/devices/toggle-all',
  
  // Routines
  ROUTINES: '/api/routines',
  ROUTINE_BY_ID: (id: string) => `/api/routines/${id}`,
  ROUTINE_TOGGLE: (id: string) => `/api/routines/${id}/toggle`,
  ROUTINE_EXECUTE: (id: string) => `/api/routines/${id}/execute`,
  
  // Activities
  ACTIVITIES: '/api/activities',
  
  // Monitoring
  MONITORING_STATUS: '/api/monitoring/status',
  MONITORING_START: '/api/monitoring/start',
  MONITORING_STOP: '/api/monitoring/stop',
  
  // WebSocket
  WS: '/ws',
} as const;

export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

export const getWsUrl = (): string => {
  const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
  const baseWithoutProtocol = API_BASE_URL.replace(/^https?:\/\//, '');
  return `${wsProtocol}://${baseWithoutProtocol}${API_ENDPOINTS.WS}`;
};
