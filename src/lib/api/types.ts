// API Response Types for FastAPI Backend

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

// Device Types from API
export interface ApiDevice {
  id: string;
  name: string;
  type: 'tuya' | 'snmp';
  icon?: string;
  is_on: boolean;
  status: 'online' | 'offline';
  // Tuya specific
  device_id?: string;
  local_key?: string;
  // SNMP specific
  ip?: string;
  community_string?: string;
  port?: number;
}

export interface DeviceToggleRequest {
  state: boolean;
}

export interface DeviceToggleResponse {
  success: boolean;
  device_id: string;
  new_state: boolean;
}

// Monitoring Types
export interface MonitoringStatus {
  is_running: boolean;
  uptime_seconds?: number;
  last_check?: string;
}

// WebSocket Message Types
export interface WsMessage {
  type: 'device_update' | 'monitoring_status' | 'error' | 'ping';
  payload: unknown;
}

export interface WsDeviceUpdate {
  device_id: string;
  is_on: boolean;
  status: 'online' | 'offline';
}
