import { useCallback } from 'react';
import { Device } from '@/types/device';
import { mockDevices } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useNotifications } from '@/hooks/useNotifications';

const STORAGE_KEY = 'smart-office-devices';

export function useDevices() {
  const [devices, setDevices] = useLocalStorage<Device[]>(STORAGE_KEY, mockDevices);
  const { addLog } = useActivityLog();
  const { sendNotification } = useNotifications();

  const toggleDevice = useCallback((id: string) => {
    setDevices((prev) =>
      prev.map((device) => {
        if (device.id === id) {
          if (device.status === 'offline') {
            toast({
              title: 'Dispositivo desconectado',
              description: `${device.name} não está respondendo. Verifique a conexão.`,
              variant: 'destructive',
            });
            return device;
          }
          const newState = !device.isOn;
          
          // Log activity
          addLog({
            type: newState ? 'device_on' : 'device_off',
            title: newState ? 'Dispositivo ligado' : 'Dispositivo desligado',
            description: `${device.name} foi ${newState ? 'ligado' : 'desligado'}`,
            deviceName: device.name,
          });

          // Send browser notification
          sendNotification({
            title: newState ? '🟢 Dispositivo ligado' : '⚪ Dispositivo desligado',
            body: `${device.name} foi ${newState ? 'ligado' : 'desligado'} com sucesso.`,
          });

          toast({
            title: newState ? 'Dispositivo ligado' : 'Dispositivo desligado',
            description: `${device.name} foi ${newState ? 'ligado' : 'desligado'} com sucesso.`,
          });
          return { ...device, isOn: newState };
        }
        return device;
      })
    );
  }, [setDevices, addLog, sendNotification]);

  const toggleAllDevices = useCallback((turnOn: boolean) => {
    const onlineDevices = devices.filter(d => d.status === 'online');
    const offlineCount = devices.length - onlineDevices.length;
    
    setDevices((prev) =>
      prev.map((device) => {
        if (device.status === 'online') {
          return { ...device, isOn: turnOn };
        }
        return device;
      })
    );

    // Log activity
    addLog({
      type: 'master_switch',
      title: turnOn ? 'Master Switch: Tudo ligado' : 'Master Switch: Tudo desligado',
      description: `${onlineDevices.length} dispositivos ${turnOn ? 'ligados' : 'desligados'}${offlineCount > 0 ? ` (${offlineCount} offline)` : ''}`,
    });

    // Send browser notification
    sendNotification({
      title: turnOn ? '🟢 Todos os dispositivos ligados' : '⚪ Todos os dispositivos desligados',
      body: `${onlineDevices.length} dispositivos foram ${turnOn ? 'ligados' : 'desligados'}.`,
    });

    toast({
      title: turnOn ? 'Todos ligados' : 'Todos desligados',
      description: offlineCount > 0 
        ? `${onlineDevices.length} dispositivos ${turnOn ? 'ligados' : 'desligados'}. ${offlineCount} offline.`
        : `${onlineDevices.length} dispositivos ${turnOn ? 'ligados' : 'desligados'}.`,
    });
  }, [devices, setDevices, addLog, sendNotification]);

  const addDevice = useCallback((device: Omit<Device, 'id'>) => {
    const newDevice: Device = {
      ...device,
      id: Date.now().toString(),
    };
    setDevices((prev) => [...prev, newDevice]);

    addLog({
      type: 'device_added',
      title: 'Novo dispositivo adicionado',
      description: `${device.name} foi cadastrado`,
      deviceName: device.name,
    });

    toast({
      title: 'Dispositivo adicionado',
      description: `${device.name} foi cadastrado com sucesso.`,
    });
  }, [setDevices, addLog]);

  const updateDevice = useCallback((id: string, updates: Partial<Device>) => {
    const device = devices.find(d => d.id === id);
    setDevices((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      )
    );

    addLog({
      type: 'device_updated',
      title: 'Dispositivo atualizado',
      description: `${updates.name || device?.name || 'Dispositivo'} foi atualizado`,
      deviceName: updates.name || device?.name,
    });

    toast({
      title: 'Dispositivo atualizado',
      description: 'As alterações foram salvas.',
    });
  }, [devices, setDevices, addLog]);

  const deleteDevice = useCallback((id: string) => {
    const device = devices.find(d => d.id === id);
    setDevices((prev) => prev.filter((d) => d.id !== id));

    addLog({
      type: 'device_deleted',
      title: 'Dispositivo removido',
      description: device ? `${device.name} foi removido` : 'Dispositivo removido',
      deviceName: device?.name,
    });

    toast({
      title: 'Dispositivo removido',
      description: device ? `${device.name} foi removido.` : 'Dispositivo removido.',
    });
  }, [devices, setDevices, addLog]);

  return {
    devices,
    toggleDevice,
    toggleAllDevices,
    addDevice,
    updateDevice,
    deleteDevice,
  };
}
