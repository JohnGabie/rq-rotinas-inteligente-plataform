// API Configuration - Change this to your FastAPI backend URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// API version prefix
const API_PREFIX = '/api/v1';

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: `${API_PREFIX}/auth/login`,
  AUTH_LOGOUT: `${API_PREFIX}/auth/logout`,
  AUTH_ME: `${API_PREFIX}/auth/me`,
  
  // Devices
  DEVICES: `${API_PREFIX}/devices`,
  DEVICE_BY_ID: (id: string) => `${API_PREFIX}/devices/${id}`,
  DEVICE_TOGGLE: (id: string) => `${API_PREFIX}/devices/${id}/toggle`,
  DEVICE_SYNC: (id: string) => `${API_PREFIX}/devices/${id}/sync`,
  DEVICES_TOGGLE_ALL: `${API_PREFIX}/devices/toggle-all`,
  
  // Routines
  ROUTINES: `${API_PREFIX}/routines`,
  ROUTINE_BY_ID: (id: string) => `${API_PREFIX}/routines/${id}`,
  ROUTINE_TOGGLE: (id: string) => `${API_PREFIX}/routines/${id}/toggle`,
  ROUTINE_EXECUTE: (id: string) => `${API_PREFIX}/routines/${id}/execute`,
  
  // Activities
  ACTIVITIES: `${API_PREFIX}/activities`,
  
  // Monitoring
  MONITORING_STATUS: `${API_PREFIX}/monitoring/status`,
  MONITORING_START: `${API_PREFIX}/monitoring/start`,
  MONITORING_STOP: `${API_PREFIX}/monitoring/stop`,
  
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
