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

// Routine Types from API
export interface ApiRoutineAction {
  device_id: string;
  turn_on: boolean;
  order: number;
  delay: number;
}

export interface ApiRoutine {
  id: string;
  name: string;
  is_active: boolean;
  trigger_type: 'time' | 'manual' | 'routine_complete' | 'device_state';
  trigger_time?: string;
  week_days: string[];
  trigger_routine_id?: string;
  trigger_device_id?: string;
  trigger_device_state?: 'on' | 'off';
  trigger_cooldown_minutes?: number;
  actions: ApiRoutineAction[];
}

export interface RoutineToggleRequest {
  is_active: boolean;
}

export interface RoutineExecuteResponse {
  success: boolean;
  routine_id: string;
  executed_actions: number;
  failed_actions: number;
  execution_time_ms: number;
}

// Activity Types from API
export interface ApiActivityLog {
  id: string;
  type: string;
  title: string;
  description: string;
  device_name?: string;
  routine_name?: string;
  timestamp: string;
}

// WebSocket Message Types
export interface WsMessage {
  type: 'device_update' | 'monitoring_status' | 'routine_executed' | 'error' | 'ping';
  payload: unknown;
}

export interface WsDeviceUpdate {
  device_id: string;
  is_on: boolean;
  status: 'online' | 'offline';
}
