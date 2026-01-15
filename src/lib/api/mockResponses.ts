// API response converters and emergency mock login
// These convert between API (snake_case) and frontend (camelCase) formats

import { ApiDevice, ApiRoutine, ApiRoutineAction, LoginResponse, User } from './types';
import { Device, Routine, RoutineAction, WeekDay, DeviceIcon } from '@/types/device';

// Simple hash function for mock password validation (emergency fallback only)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

// Mock user database (emergency fallback only)
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@admin.com',
    name: 'Administrador',
    passwordHash: simpleHash('admin'),
    role: 'admin' as const,
  },
];

// Mock JWT token generator (emergency fallback only)
const generateMockToken = (userId: string): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: userId,
    iat: Date.now(),
    exp: Date.now() + (24 * 60 * 60 * 1000),
  }));
  const signature = btoa('mock-signature');
  return `${header}.${payload}.${signature}`;
};

// Emergency mock login - only used when USE_MOCK_API is true
export const mockLogin = (email: string, password: string): LoginResponse | null => {
  const user = MOCK_USERS.find(u => u.email === email);
  
  if (!user) {
    return null;
  }
  
  const passwordHash = simpleHash(password);
  if (passwordHash !== user.passwordHash) {
    return null;
  }
  
  const mockUser: User = {
    id: user.id,
    email: user.email,
    name: user.name,
    is_active: true,
    role: user.role,
    created_at: new Date().toISOString(),
  };
  
  return {
    access_token: generateMockToken(user.id),
    token_type: 'Bearer',
    expires_in: 86400,
    user: mockUser,
  };
};

// ============================================
// API <-> Frontend Format Converters
// ============================================

// Convert API device format to frontend format
export const apiDeviceToDevice = (apiDevice: ApiDevice): Device => ({
  id: apiDevice.id,
  name: apiDevice.name,
  type: apiDevice.type,
  icon: apiDevice.icon as DeviceIcon | undefined,
  isOn: apiDevice.is_on,
  status: apiDevice.status,
  deviceId: apiDevice.device_id,
  localKey: apiDevice.local_key,
  ip: apiDevice.ip,
  communityString: apiDevice.community_string,
  port: apiDevice.port,
  snmpBaseOid: apiDevice.snmp_base_oid,
  snmpOutletNumber: apiDevice.snmp_outlet_number,
  createdAt: apiDevice.created_at,
  updatedAt: apiDevice.updated_at,
});

// Convert frontend device format to API format
export const deviceToApiDevice = (device: Device): Partial<ApiDevice> => ({
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
  snmp_base_oid: device.snmpBaseOid,
  snmp_outlet_number: device.snmpOutletNumber,
});

// Convert API routine action to frontend format
export const apiRoutineActionToRoutineAction = (apiAction: ApiRoutineAction): RoutineAction => ({
  id: apiAction.id,
  deviceId: apiAction.device_id,
  turnOn: apiAction.turn_on,
  order: apiAction.order,
  delay: apiAction.delay,
});

// Convert frontend routine action to API format
export const routineActionToApiRoutineAction = (action: RoutineAction): ApiRoutineAction => ({
  id: action.id,
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
  lastExecutedAt: apiRoutine.last_executed_at,
  createdAt: apiRoutine.created_at,
  updatedAt: apiRoutine.updated_at,
});

// Convert frontend routine to API format
export const routineToApiRoutine = (routine: Routine): Partial<ApiRoutine> => ({
  id: routine.id,
  name: routine.name,
  is_active: routine.isActive,
  trigger_type: routine.triggerType,
  trigger_time: routine.triggerTime,
  week_days: routine.weekDays,
  trigger_routine_id: routine.triggerRoutineId,
  trigger_device_id: routine.triggerDeviceId,
  trigger_device_state: routine.triggerDeviceState,
  trigger_cooldown_minutes: routine.triggerCooldownMinutes ?? 0,
  actions: routine.actions.map(routineActionToApiRoutineAction),
});