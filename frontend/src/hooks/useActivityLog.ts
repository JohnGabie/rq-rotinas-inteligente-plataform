import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalStorage } from './useLocalStorage';
import { ActivityLog, ActivityType } from '@/types/activity';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { ApiActivityLog } from '@/lib/api/types';
import { USE_MOCK_API } from '@/lib/api/mode';

const STORAGE_KEY = 'rotina-inteligente-activity-log';
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
  createdAt: apiLog.created_at,
});

export function useActivityLog() {
  const queryClient = useQueryClient();
  const [localLogs, setLocalLogs] = useLocalStorage<ActivityLog[]>(STORAGE_KEY, []);

  // Query to fetch activity logs
  const { data: logs = localLogs, isLoading, refetch } = useQuery({
    queryKey: ['activities'],
    queryFn: async (): Promise<ActivityLog[]> => {
      if (USE_MOCK_API) {
        return localLogs;
      }
      const response = await apiClient.get<ApiActivityLog[]>(API_ENDPOINTS.ACTIVITIES);
      if (response.success && response.data) {
        const activitiesData = response.data.map(apiActivityToActivity);
        setLocalLogs(activitiesData); // Cache locally
        return activitiesData;
      }
      // Fallback to local logs on error
      return localLogs;
    },
    staleTime: USE_MOCK_API ? Infinity : 60000, // 1 minute for API
    refetchOnWindowFocus: !USE_MOCK_API,
  });

  // Mutation for adding a log
  const addMutation = useMutation({
    mutationFn: async (params: AddLogParams): Promise<ActivityLog> => {
      const newLog: ActivityLog = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        ...params,
      };

      // In real API mode, we don't need to POST as logs are created by backend
      // This is just for local tracking
      return newLog;
    },
    onSuccess: (newLog) => {
      // Update local cache
      queryClient.setQueryData<ActivityLog[]>(['activities'], (old) => {
        const updated = [newLog, ...(old || [])];
        return updated.slice(0, MAX_LOGS);
      });
      
      setLocalLogs((prev) => {
        const updated = [newLog, ...prev];
        return updated.slice(0, MAX_LOGS);
      });
    },
  });

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

  const clearLogs = useCallback(() => {
    setLocalLogs([]);
    queryClient.setQueryData(['activities'], []);
  }, [setLocalLogs, queryClient]);

  return {
    logs,
    isLoading,
    refetch,
    addLog,
    clearLogs,
  };
}
