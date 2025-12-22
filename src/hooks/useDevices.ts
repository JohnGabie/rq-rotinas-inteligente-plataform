import { useState, useCallback } from 'react';
import { Device } from '@/types/device';
import { mockDevices } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>(mockDevices);

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
          toast({
            title: newState ? 'Dispositivo ligado' : 'Dispositivo desligado',
            description: `${device.name} foi ${newState ? 'ligado' : 'desligado'} com sucesso.`,
          });
          return { ...device, isOn: newState };
        }
        return device;
      })
    );
  }, []);

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

    toast({
      title: turnOn ? 'Todos ligados' : 'Todos desligados',
      description: offlineCount > 0 
        ? `${onlineDevices.length} dispositivos ${turnOn ? 'ligados' : 'desligados'}. ${offlineCount} offline.`
        : `${onlineDevices.length} dispositivos ${turnOn ? 'ligados' : 'desligados'}.`,
    });
  }, [devices]);

  const addDevice = useCallback((device: Omit<Device, 'id'>) => {
    const newDevice: Device = {
      ...device,
      id: Date.now().toString(),
    };
    setDevices((prev) => [...prev, newDevice]);
    toast({
      title: 'Dispositivo adicionado',
      description: `${device.name} foi cadastrado com sucesso.`,
    });
  }, []);

  const updateDevice = useCallback((id: string, updates: Partial<Device>) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === id ? { ...device, ...updates } : device
      )
    );
    toast({
      title: 'Dispositivo atualizado',
      description: 'As alterações foram salvas.',
    });
  }, []);

  const deleteDevice = useCallback((id: string) => {
    const device = devices.find(d => d.id === id);
    setDevices((prev) => prev.filter((d) => d.id !== id));
    toast({
      title: 'Dispositivo removido',
      description: device ? `${device.name} foi removido.` : 'Dispositivo removido.',
    });
  }, [devices]);

  return {
    devices,
    toggleDevice,
    toggleAllDevices,
    addDevice,
    updateDevice,
    deleteDevice,
  };
}
