import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalStorage } from './useLocalStorage';
import { ActivityLog, ActivityType } from '@/types/activity';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { ApiActivityLog } from '@/lib/api/types';

const STORAGE_KEY = 'rotina-inteligente-activity-log';
// Marca d'água de "notificações dispensadas": logs até este instante ficam
// ocultos no painel. O histórico no banco NÃO é apagado — ele alimenta o
// HistoryDashboard e a timeline. Este painel é apenas notificação.
const CLEARED_AT_KEY = 'rotina-inteligente-activity-cleared-at';
const MAX_LOGS = 100;

interface AddLogParams {
  type: ActivityType;
  title: string;
  description?: string;
  deviceName?: string;
  routineName?: string;
}

// Convert API activity log to frontend format
const apiActivityToActivity = (apiLog: ApiActivityLog): ActivityLog => ({
  id: apiLog.id,
  type: apiLog.type as ActivityType,
  title: apiLog.title,
  description: apiLog.description,
  timestamp: apiLog.timestamp,
  deviceName: apiLog.device_name,
  routineName: apiLog.routine_name,
  userName: apiLog.user_name,
  createdAt: apiLog.created_at,
});

export function useActivityLog() {
  const queryClient = useQueryClient();
  const [localLogs, setLocalLogs] = useLocalStorage<ActivityLog[]>(STORAGE_KEY, []);
  const [clearedAt, setClearedAt] = useLocalStorage<number>(CLEARED_AT_KEY, 0);

  // Query to fetch activity logs from API
  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['activities'],
    queryFn: async (): Promise<ActivityLog[]> => {
      // Backend returns paginated response: { items: [], total, limit, offset }
      // limit explícito: o backend usa 50 por padrão (máximo 100), então sem
      // este parâmetro o painel nunca mostrava mais que 50 registros.
      const response = await apiClient.get<{ items: ApiActivityLog[]; total: number; limit: number; offset: number }>(
        `${API_ENDPOINTS.ACTIVITIES}?limit=${MAX_LOGS}`
      );
      if (response.success && response.data) {
        const activitiesData = response.data.items.map(apiActivityToActivity);
        setLocalLogs(activitiesData); // Cache locally for offline fallback
        return activitiesData;
      }
      // Fallback to local logs on error
      return localLogs;
    },
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: true,
  });

  // Add log locally (backend creates logs automatically, this is for immediate UI feedback)
  const addLog = useCallback((params: AddLogParams): ActivityLog => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      ...params,
    };

    // Optimistic update for immediate UI feedback
    setLocalLogs((prev) => {
      const updated = [newLog, ...prev];
      return updated.slice(0, MAX_LOGS);
    });

    queryClient.setQueryData<ActivityLog[]>(['activities'], (old) => {
      const updated = [newLog, ...(old || [])];
      return updated.slice(0, MAX_LOGS);
    });

    return newLog;
  }, [setLocalLogs, queryClient]);

  // Dispensa as notificações: apenas avança a marca d'água local.
  // Antes zerava o cache sem persistir nada, então o refetch seguinte (disparado
  // a cada evento do WebSocket) trazia tudo de volta — o botão parecia não funcionar.
  const clearLogs = useCallback(() => {
    setClearedAt(Date.now());
  }, [setClearedAt]);

  // Só as notificações posteriores à última limpeza aparecem no painel.
  const visibleLogs = useMemo(
    () => logs.filter((log) => log.timestamp > clearedAt),
    [logs, clearedAt]
  );

  return {
    logs: visibleLogs,
    isLoading,
    refetch,
    addLog,
    clearLogs,
  };
}
