// Mock responses for local development
// These will be replaced by actual FastAPI responses

import { ApiDevice, LoginResponse, MonitoringStatus } from './types';

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
