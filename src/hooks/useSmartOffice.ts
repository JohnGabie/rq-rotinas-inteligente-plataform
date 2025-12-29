import { useState, useEffect, useCallback, useRef } from 'react';
import type { Device, MonitoringConfig, MonitoringStatus, WebSocketMessage } from '@/types';
import { devicesApi, monitoringApi, getStoredTokens } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface UseSmartOfficeState {
  devices: Device[];
  isConnected: boolean;
  isMonitoring: boolean;
  monitoringStatus: MonitoringStatus | null;
  isLoading: boolean;
}

interface UseSmartOfficeActions {
  controlSnmpOutlet: (outletNumber: number, state: boolean) => Promise<void>;
  controlTuyaDevice: (deviceId: string, state: boolean) => Promise<void>;
  startMonitoring: (config: MonitoringConfig) => Promise<void>;
  stopMonitoring: () => Promise<void>;
  refreshDevices: () => Promise<void>;
  refreshMonitoringStatus: () => Promise<void>;
}

type UseSmartOfficeReturn = UseSmartOfficeState & UseSmartOfficeActions;

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';
const RECONNECT_INITIAL_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;

export const useSmartOffice = (): UseSmartOfficeReturn => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectDelayRef = useRef(RECONNECT_INITIAL_DELAY);
  const { toast } = useToast();

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    const tokens = getStoredTokens();
    if (!tokens?.accessToken) return;

    // Determine protocol based on environment
    const wsUrl = window.location.protocol === 'https:'
      ? WS_BASE_URL.replace('ws://', 'wss://')
      : WS_BASE_URL;

    try {
      const ws = new WebSocket(`${wsUrl}/ws?token=${tokens.accessToken}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectDelayRef.current = RECONNECT_INITIAL_DELAY;
      };

      ws.onclose = () => {
        setIsConnected(false);
        
        // Schedule reconnection with exponential backoff
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectWebSocket();
        }, reconnectDelayRef.current);
        
        // Increase delay for next attempt (exponential backoff)
        reconnectDelayRef.current = Math.min(
          reconnectDelayRef.current * 2,
          RECONNECT_MAX_DELAY
        );
      };

      ws.onerror = () => {
        // Error handling - close will trigger reconnection
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'device_update':
              setDevices((prev) => {
                const device = message.payload as Device;
                const index = prev.findIndex((d) => d.id === device.id);
                if (index >= 0) {
                  const updated = [...prev];
                  updated[index] = device;
                  return updated;
                }
                return [...prev, device];
              });
              break;
              
            case 'monitoring_status':
              const status = message.payload as MonitoringStatus;
              setMonitoringStatus(status);
              setIsMonitoring(status.isRunning);
              break;
              
            case 'error':
              toast({
                variant: 'destructive',
                title: 'Erro do servidor',
                description: String(message.payload),
              });
              break;
          }
        } catch {
          // Ignore parse errors
        }
      };
    } catch {
      // Connection failed - will retry
    }
  }, [toast]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Initialize WebSocket on mount
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  // Fetch initial data
  const refreshDevices = useCallback(async () => {
    try {
      const response = await devicesApi.getAll();
      if (response.success && response.data) {
        setDevices(response.data);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dispositivos',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }, [toast]);

  const refreshMonitoringStatus = useCallback(async () => {
    try {
      const response = await monitoringApi.getStatus();
      if (response.success && response.data) {
        setMonitoringStatus(response.data);
        setIsMonitoring(response.data.isRunning);
      }
    } catch {
      // Ignore status errors
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await Promise.all([refreshDevices(), refreshMonitoringStatus()]);
      setIsLoading(false);
    };

    loadInitialData();
  }, [refreshDevices, refreshMonitoringStatus]);

  // Device control
  const controlSnmpOutlet = useCallback(async (outletNumber: number, state: boolean) => {
    try {
      const response = await devicesApi.controlSnmpOutlet(outletNumber, { state });
      
      if (response.success && response.data) {
        setDevices((prev) => {
          const updated = prev.map((d) =>
            d.type === 'snmp' && d.outletNumber === outletNumber
              ? { ...d, isOn: state, lastUpdate: new Date().toISOString() }
              : d
          );
          return updated;
        });
        
        toast({
          title: state ? 'Dispositivo ligado' : 'Dispositivo desligado',
          description: `Tomada SNMP ${outletNumber} ${state ? 'ligada' : 'desligada'}`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao controlar dispositivo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }, [toast]);

  const controlTuyaDevice = useCallback(async (deviceId: string, state: boolean) => {
    try {
      const response = await devicesApi.controlTuyaDevice(deviceId, { state });
      
      if (response.success && response.data) {
        setDevices((prev) => {
          const updated = prev.map((d) =>
            d.type === 'tuya' && d.deviceId === deviceId
              ? { ...d, isOn: state, lastUpdate: new Date().toISOString() }
              : d
          );
          return updated;
        });
        
        const device = devices.find((d) => d.deviceId === deviceId);
        toast({
          title: state ? 'Dispositivo ligado' : 'Dispositivo desligado',
          description: `${device?.name || 'Dispositivo Tuya'} ${state ? 'ligado' : 'desligado'}`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao controlar dispositivo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }, [devices, toast]);

  // Monitoring control
  const startMonitoring = useCallback(async (config: MonitoringConfig) => {
    try {
      const response = await monitoringApi.start({
        gatewayIp: config.gatewayIp,
        pingInterval: config.pingInterval,
        maxRetries: config.maxRetries,
      });
      
      if (response.success && response.data) {
        setMonitoringStatus(response.data);
        setIsMonitoring(true);
        
        toast({
          title: 'Monitoramento iniciado',
          description: `Monitorando ${config.gatewayIp} a cada ${config.pingInterval}s`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao iniciar monitoramento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }, [toast]);

  const stopMonitoring = useCallback(async () => {
    try {
      await monitoringApi.stop();
      setIsMonitoring(false);
      setMonitoringStatus((prev) => prev ? { ...prev, isRunning: false } : null);
      
      toast({
        title: 'Monitoramento parado',
        description: 'O monitoramento do gateway foi interrompido',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao parar monitoramento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }, [toast]);

  return {
    devices,
    isConnected,
    isMonitoring,
    monitoringStatus,
    isLoading,
    controlSnmpOutlet,
    controlTuyaDevice,
    startMonitoring,
    stopMonitoring,
    refreshDevices,
    refreshMonitoringStatus,
  };
};

export default useSmartOffice;
