import { useState, useCallback } from 'react';
import { Routine } from '@/types/device';
import { mockRoutines } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>(mockRoutines);

  const toggleRoutine = useCallback((id: string) => {
    setRoutines((prev) =>
      prev.map((routine) => {
        if (routine.id === id) {
          const newState = !routine.isActive;
          toast({
            title: newState ? 'Rotina ativada' : 'Rotina desativada',
            description: `"${routine.name}" foi ${newState ? 'ativada' : 'desativada'}.`,
          });
          return { ...routine, isActive: newState };
        }
        return routine;
      })
    );
  }, []);

  const addRoutine = useCallback((routine: Omit<Routine, 'id'>) => {
    const newRoutine: Routine = {
      ...routine,
      id: Date.now().toString(),
    };
    setRoutines((prev) => [...prev, newRoutine]);
    toast({
      title: 'Rotina criada',
      description: `"${routine.name}" foi criada com sucesso.`,
    });
  }, []);

  const updateRoutine = useCallback((id: string, updates: Partial<Routine>) => {
    setRoutines((prev) =>
      prev.map((routine) =>
        routine.id === id ? { ...routine, ...updates } : routine
      )
    );
    toast({
      title: 'Rotina atualizada',
      description: 'As alterações foram salvas.',
    });
  }, []);

  const deleteRoutine = useCallback((id: string) => {
    const routine = routines.find(r => r.id === id);
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    toast({
      title: 'Rotina removida',
      description: routine ? `"${routine.name}" foi removida.` : 'Rotina removida.',
    });
  }, [routines]);

  return {
    routines,
    toggleRoutine,
    addRoutine,
    updateRoutine,
    deleteRoutine,
  };
}
