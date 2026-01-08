// Mock responses for local development
// These will be replaced by actual FastAPI responses

import { ApiDevice, ApiRoutine, ApiRoutineAction, LoginResponse, MonitoringStatus } from './types';
import { Routine, RoutineAction, WeekDay } from '@/types/device';

// Simple hash function for mock password validation
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

// Mock user database
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@admin.com',
    name: 'Administrador',
    passwordHash: simpleHash('admin'),
  },
];

// Mock JWT token generator
const generateMockToken = (userId: string): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: userId,
    iat: Date.now(),
    exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
  }));
  const signature = btoa('mock-signature');
  return `${header}.${payload}.${signature}`;
};

export const mockLogin = (email: string, password: string): LoginResponse | null => {
  const user = MOCK_USERS.find(u => u.email === email);
  
  if (!user) {
    return null;
  }
  
  const passwordHash = simpleHash(password);
  if (passwordHash !== user.passwordHash) {
    return null;
  }
  
  return {
    access_token: generateMockToken(user.id),
    token_type: 'bearer',
    expires_in: 86400, // 24 hours in seconds
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
};

export const mockDevices: ApiDevice[] = [
  {
    id: '1',
    name: 'Tomada do Servidor',
    type: 'tuya',
    icon: 'server',
    is_on: true,
    status: 'online',
    device_id: 'bf1234567890abcd',
    local_key: 'abc123def456',
  },
  {
    id: '2',
    name: 'Régua do Escritório',
    type: 'snmp',
    icon: 'router',
    is_on: false,
    status: 'online',
    ip: '192.168.1.100',
    community_string: 'public',
    port: 161,
  },
  {
    id: '3',
    name: 'Tomada do Café',
    type: 'tuya',
    icon: 'coffee',
    is_on: true,
    status: 'online',
    device_id: 'cf9876543210dcba',
    local_key: 'xyz789abc012',
  },
  {
    id: '4',
    name: 'Impressora 3D',
    type: 'snmp',
    icon: 'printer',
    is_on: false,
    status: 'offline',
    ip: '192.168.1.105',
    community_string: 'private',
    port: 161,
  },
];

export const mockRoutines: ApiRoutine[] = [];

export const mockMonitoringStatus: MonitoringStatus = {
  is_running: false,
  uptime_seconds: 0,
};

// Convert API device format to frontend format
export const apiDeviceToDevice = (apiDevice: ApiDevice) => ({
  id: apiDevice.id,
  name: apiDevice.name,
  type: apiDevice.type,
  icon: apiDevice.icon as 'plug' | 'monitor' | 'tv' | 'air-vent' | 'printer' | 'server' | 'router' | 'lightbulb' | 'camera' | 'coffee' | 'fan' | 'speaker' | 'refrigerator' | undefined,
  isOn: apiDevice.is_on,
  status: apiDevice.status,
  deviceId: apiDevice.device_id,
  localKey: apiDevice.local_key,
  ip: apiDevice.ip,
  communityString: apiDevice.community_string,
  port: apiDevice.port,
});

// Convert frontend device format to API format
export const deviceToApiDevice = (device: {
  id: string;
  name: string;
  type: 'tuya' | 'snmp';
  icon?: string;
  isOn: boolean;
  status: 'online' | 'offline';
  deviceId?: string;
  localKey?: string;
  ip?: string;
  communityString?: string;
  port?: number;
}): ApiDevice => ({
  id: device.id,
  name: device.name,
  type: device.type,
  icon: device.icon,
  is_on: device.isOn,
  status: device.status,
  device_id: device.deviceId,
  local_key: device.localKey,
  ip: device.ip,
  community_string: device.communityString,
  port: device.port,
});

// Convert API routine action to frontend format
export const apiRoutineActionToRoutineAction = (apiAction: ApiRoutineAction): RoutineAction => ({
  deviceId: apiAction.device_id,
  turnOn: apiAction.turn_on,
  order: apiAction.order,
  delay: apiAction.delay,
});

// Convert frontend routine action to API format
export const routineActionToApiRoutineAction = (action: RoutineAction): ApiRoutineAction => ({
  device_id: action.deviceId,
  turn_on: action.turnOn,
  order: action.order,
  delay: action.delay,
});

// Convert API routine to frontend format
export const apiRoutineToRoutine = (apiRoutine: ApiRoutine): Routine => ({
  id: apiRoutine.id,
  name: apiRoutine.name,
  isActive: apiRoutine.is_active,
  triggerType: apiRoutine.trigger_type,
  triggerTime: apiRoutine.trigger_time,
  weekDays: apiRoutine.week_days as WeekDay[],
  triggerRoutineId: apiRoutine.trigger_routine_id,
  triggerDeviceId: apiRoutine.trigger_device_id,
  triggerDeviceState: apiRoutine.trigger_device_state,
  triggerCooldownMinutes: apiRoutine.trigger_cooldown_minutes,
  actions: apiRoutine.actions.map(apiRoutineActionToRoutineAction),
});

// Convert frontend routine to API format
export const routineToApiRoutine = (routine: Routine): ApiRoutine => ({
  id: routine.id,
  name: routine.name,
  is_active: routine.isActive,
  trigger_type: routine.triggerType === 'startup' ? 'manual' : routine.triggerType,
  trigger_time: routine.triggerTime,
  week_days: routine.weekDays,
  trigger_routine_id: routine.triggerRoutineId,
  trigger_device_id: routine.triggerDeviceId,
  trigger_device_state: routine.triggerDeviceState,
  trigger_cooldown_minutes: routine.triggerCooldownMinutes,
  actions: routine.actions.map(routineActionToApiRoutineAction),
});
