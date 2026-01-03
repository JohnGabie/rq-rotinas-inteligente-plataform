import { useCallback } from 'react';
import { Routine } from '@/types/device';
import { toast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useNotifications } from '@/hooks/useNotifications';

const STORAGE_KEY = 'rotina-inteligente-routines';

// Flag to use mock or real API - routines stored locally for now
const USE_MOCK_API = true;

// Initial empty routines - will be loaded from localStorage or empty
const initialRoutines: Routine[] = [];

export function useRoutines() {
  const [routines, setRoutines] = useLocalStorage<Routine[]>(STORAGE_KEY, initialRoutines);
  const { addLog } = useActivityLog();
  const { sendNotification } = useNotifications();

  const toggleRoutine = useCallback((id: string) => {
    setRoutines((prev) =>
      prev.map((routine) => {
        if (routine.id === id) {
          const newState = !routine.isActive;

          addLog({
            type: newState ? 'routine_activated' : 'routine_deactivated',
            title: newState ? 'Rotina ativada' : 'Rotina desativada',
            description: `"${routine.name}" foi ${newState ? 'ativada' : 'desativada'}`,
            routineName: routine.name,
          });

          sendNotification({
            title: newState ? '▶️ Rotina ativada' : '⏸️ Rotina desativada',
            body: `"${routine.name}" foi ${newState ? 'ativada' : 'desativada'}.`,
          });

          toast({
            title: newState ? 'Rotina ativada' : 'Rotina desativada',
            description: `"${routine.name}" foi ${newState ? 'ativada' : 'desativada'}.`,
          });
          return { ...routine, isActive: newState };
        }
        return routine;
      })
    );
  }, [setRoutines, addLog, sendNotification]);

  const addRoutine = useCallback((routine: Omit<Routine, 'id'>) => {
    const newRoutine: Routine = {
      ...routine,
      id: Date.now().toString(),
    };
    setRoutines((prev) => [...prev, newRoutine]);

    addLog({
      type: 'routine_created',
      title: 'Nova rotina criada',
      description: `"${routine.name}" foi criada com ${routine.actions.length} ação(ões)`,
      routineName: routine.name,
    });

    toast({
      title: 'Rotina criada',
      description: `"${routine.name}" foi criada com sucesso.`,
    });
  }, [setRoutines, addLog]);

  const updateRoutine = useCallback((id: string, updates: Partial<Routine>) => {
    const routine = routines.find(r => r.id === id);
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      )
    );

    addLog({
      type: 'routine_updated',
      title: 'Rotina atualizada',
      description: `"${updates.name || routine?.name || 'Rotina'}" foi atualizada`,
      routineName: updates.name || routine?.name,
    });

    toast({
      title: 'Rotina atualizada',
      description: 'As alterações foram salvas.',
    });
  }, [routines, setRoutines, addLog]);

  const deleteRoutine = useCallback((id: string) => {
    const routine = routines.find(r => r.id === id);
    setRoutines((prev) => prev.filter((r) => r.id !== id));

    addLog({
      type: 'routine_deleted',
      title: 'Rotina removida',
      description: routine ? `"${routine.name}" foi removida` : 'Rotina removida',
      routineName: routine?.name,
    });

    toast({
      title: 'Rotina removida',
      description: routine ? `"${routine.name}" foi removida.` : 'Rotina removida.',
    });
  }, [routines, setRoutines, addLog]);

  const executeRoutine = useCallback(async (id: string) => {
    const routine = routines.find(r => r.id === id);
    if (!routine) return;

    // Sort actions by order
    const sortedActions = [...routine.actions].sort((a, b) => a.order - b.order);
    
    // Check if all delays are 0 (simultaneous execution)
    const isSimultaneous = sortedActions.every(a => a.delay === 0);

    addLog({
      type: 'routine_executed',
      title: 'Rotina executada',
      description: `"${routine.name}" foi executada manualmente`,
      routineName: routine.name,
    });

    sendNotification({
      title: '🚀 Rotina executada',
      body: `"${routine.name}" está sendo executada.`,
    });

    toast({
      title: 'Executando rotina',
      description: `"${routine.name}" - ${sortedActions.length} ação(ões)${isSimultaneous ? ' simultâneas' : ' em sequência'}.`,
    });

    // In a real scenario, this would call the API to execute actions
    // For now, we just simulate the execution with toasts
    if (!isSimultaneous) {
      for (let i = 0; i < sortedActions.length; i++) {
        const action = sortedActions[i];
        if (i > 0 && sortedActions[i - 1].delay > 0) {
          await new Promise(resolve => setTimeout(resolve, sortedActions[i - 1].delay * 1000));
        }
        // Here you would call toggleDevice for each action
        console.log(`Executing action ${i + 1}: Device ${action.deviceId} -> ${action.turnOn ? 'ON' : 'OFF'}`);
      }
    } else {
      // Simultaneous execution
      console.log('Executing all actions simultaneously');
    }

    toast({
      title: 'Rotina concluída',
      description: `"${routine.name}" foi executada com sucesso.`,
    });
  }, [routines, addLog, sendNotification]);

  return {
    routines,
    toggleRoutine,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    executeRoutine,
  };
}
