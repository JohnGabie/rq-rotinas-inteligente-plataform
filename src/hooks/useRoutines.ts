import { useCallback } from 'react';
import { Routine } from '@/types/device';
import { mockRoutines } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useNotifications } from '@/hooks/useNotifications';

const STORAGE_KEY = 'smart-office-routines';

export function useRoutines() {
  const [routines, setRoutines] = useLocalStorage<Routine[]>(STORAGE_KEY, mockRoutines);
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

  return {
    routines,
    toggleRoutine,
    addRoutine,
    updateRoutine,
    deleteRoutine,
  };
}
