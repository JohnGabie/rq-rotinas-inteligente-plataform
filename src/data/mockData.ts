import { Device, Routine } from '@/types/device';

export const mockDevices: Device[] = [
  {
    id: '1',
    name: 'Tomada do Servidor',
    type: 'tuya',
    isOn: true,
    status: 'online',
    deviceId: 'bf1234567890abcd',
    localKey: 'abc123def456',
  },
  {
    id: '2',
    name: 'Régua do Escritório',
    type: 'snmp',
    isOn: false,
    status: 'online',
    ip: '192.168.1.100',
    communityString: 'public',
    port: 161,
  },
  {
    id: '3',
    name: 'Tomada do Café',
    type: 'tuya',
    isOn: true,
    status: 'online',
    deviceId: 'cf9876543210dcba',
    localKey: 'xyz789abc012',
  },
  {
    id: '4',
    name: 'Impressora 3D',
    type: 'snmp',
    isOn: false,
    status: 'offline',
    ip: '192.168.1.105',
    communityString: 'private',
    port: 161,
  },
];

export const mockRoutines: Routine[] = [
  {
    id: '1',
    name: 'Início do Expediente',
    isActive: true,
    triggerType: 'time',
    triggerTime: '08:00',
    weekDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
    actions: [
      { deviceId: '1', turnOn: true },
      { deviceId: '3', turnOn: true },
    ],
  },
  {
    id: '2',
    name: 'Fim do Expediente',
    isActive: true,
    triggerType: 'time',
    triggerTime: '18:00',
    weekDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
    actions: [
      { deviceId: '1', turnOn: false },
      { deviceId: '2', turnOn: false },
      { deviceId: '3', turnOn: false },
    ],
  },
  {
    id: '3',
    name: 'Ao Ligar o Sistema',
    isActive: false,
    triggerType: 'startup',
    weekDays: [],
    actions: [
      { deviceId: '1', turnOn: true },
    ],
  },
];
