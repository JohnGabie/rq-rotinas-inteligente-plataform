export type DeviceType = 'tuya' | 'snmp';

export type DeviceStatus = 'online' | 'offline';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  isOn: boolean;
  status: DeviceStatus;
  // Tuya specific
  deviceId?: string;
  localKey?: string;
  // SNMP specific
  ip?: string;
  communityString?: string;
  port?: number;
}

export type TriggerType = 'time' | 'startup';

export type WeekDay = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

export interface Routine {
  id: string;
  name: string;
  isActive: boolean;
  triggerType: TriggerType;
  triggerTime?: string; // HH:mm format
  weekDays: WeekDay[];
  actions: RoutineAction[];
}

export interface RoutineAction {
  deviceId: string;
  turnOn: boolean;
}
