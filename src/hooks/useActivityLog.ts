import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { ActivityLog, ActivityType } from '@/types/activity';

const STORAGE_KEY = 'smart-office-activity-log';
const MAX_LOGS = 100;

interface AddLogParams {
  type: ActivityType;
  title: string;
  description: string;
  deviceName?: string;
  routineName?: string;
}

export function useActivityLog() {
  const [logs, setLogs] = useLocalStorage<ActivityLog[]>(STORAGE_KEY, []);

  const addLog = useCallback((params: AddLogParams) => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...params,
    };

    setLogs((prev) => {
      const updated = [newLog, ...prev];
      // Manter apenas os últimos MAX_LOGS
      return updated.slice(0, MAX_LOGS);
    });

    return newLog;
  }, [setLogs]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, [setLogs]);

  return {
    logs,
    addLog,
    clearLogs,
  };
}
