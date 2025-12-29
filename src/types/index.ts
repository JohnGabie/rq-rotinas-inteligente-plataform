// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  recaptchaToken?: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Device types
export type DeviceType = 'tuya' | 'snmp';
export type DeviceStatus = 'online' | 'offline';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  isOn: boolean;
  status: DeviceStatus;
  lastUpdate?: string;
  // Tuya specific
  deviceId?: string;
  localKey?: string;
  // SNMP specific
  ip?: string;
  communityString?: string;
  port?: number;
  outletNumber?: number;
}

// Monitoring types
export interface MonitoringConfig {
  gatewayIp: string;
  pingInterval: number; // seconds
  maxRetries: number;
}

export interface MonitoringStatus {
  isRunning: boolean;
  pcStatus: 'online' | 'offline' | 'unknown';
  lastCheck?: string;
  failedAttempts: number;
}

// WebSocket types
export type WebSocketMessageType = 
  | 'device_update'
  | 'monitoring_status'
  | 'connection_status'
  | 'error'
  | 'auth_required';

export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  payload: T;
  timestamp: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DeviceControlRequest {
  state: boolean;
}

export interface MonitoringStartRequest {
  gatewayIp: string;
  pingInterval: number;
  maxRetries: number;
}
