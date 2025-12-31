// API Configuration - Change this to your FastAPI backend URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  
  // Devices
  DEVICES: '/api/devices',
  SNMP_OUTLET: '/api/snmp/outlet',
  TUYA_DEVICE: '/api/tuya/device',
  
  // Monitoring
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
