import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, Power, PowerOff, Plus, X, ChevronLeft, ChevronRight, Check, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Device, Routine, TriggerType, WeekDay, RoutineAction } from '@/types/device';
import { cn } from '@/lib/utils';

interface RoutineWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine?: Routine | null;
  devices: Device[];
  onSave: (routine: Omit<Routine, 'id'>) => void;
  onUpdate?: (id: string, updates: Partial<Routine>) => void;
  onDelete?: (id: string) => void;
}

const weekDayOptions: { value: WeekDay; label: string }[] = [
  { value: 'seg', label: 'Segunda' },
  { value: 'ter', label: 'Terça' },
  { value: 'qua', label: 'Quarta' },
  { value: 'qui', label: 'Quinta' },
  { value: 'sex', label: 'Sexta' },
  { value: 'sab', label: 'Sábado' },
  { value: 'dom', label: 'Domingo' },
];

export function RoutineWizard({
  open,
  onOpenChange,
  routine,
  devices,
  onSave,
  onUpdate,
  onDelete,
}: RoutineWizardProps) {
  const isEditing = !!routine;
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<TriggerType>('time');
  const [triggerTime, setTriggerTime] = useState('08:00');
  const [weekDays, setWeekDays] = useState<WeekDay[]>(['seg', 'ter', 'qua', 'qui', 'sex']);
  const [actions, setActions] = useState<RoutineAction[]>([]);

  useEffect(() => {
    if (routine) {
      setName(routine.name);
      setTriggerType(routine.triggerType);
      setTriggerTime(routine.triggerTime || '08:00');
      setWeekDays(routine.weekDays);
      setActions(routine.actions);
    } else {
      setName('');
      setTriggerType('time');
      setTriggerTime('08:00');
      setWeekDays(['seg', 'ter', 'qua', 'qui', 'sex']);
      setActions([]);
    }
    setStep(1);
  }, [routine, open]);

  const toggleWeekDay = (day: WeekDay) => {
    setWeekDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addAction = (deviceId: string, turnOn: boolean) => {
    const existing = actions.find((a) => a.deviceId === deviceId);
    if (existing) {
      setActions((prev) =>
        prev.map((a) => (a.deviceId === deviceId ? { ...a, turnOn } : a))
      );
    } else {
      setActions((prev) => [...prev, { deviceId, turnOn }]);
    }
  };

  const removeAction = (deviceId: string) => {
    setActions((prev) => prev.filter((a) => a.deviceId !== deviceId));
  };

  const handleSubmit = () => {
    const newRoutine: Omit<Routine, 'id'> = {
      name,
      isActive: routine?.isActive ?? true,
      triggerType,
      triggerTime: triggerType === 'time' ? triggerTime : undefined,
      weekDays: triggerType === 'time' ? weekDays : [],
      actions,
    };

    if (isEditing && onUpdate) {
      onUpdate(routine.id, newRoutine);
    } else {
      onSave(newRoutine);
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (routine && onDelete) {
      onDelete(routine.id);
      onOpenChange(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return name.trim().length > 0;
      case 2:
        return true;
      case 3:
        return triggerType === 'startup' || (triggerTime && weekDays.length > 0);
      case 4:
        return actions.length > 0;
      default:
        return true;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Rotina' : 'Criar Nova Rotina'}
          </DialogTitle>
          <DialogDescription>
            Passo {step} de {totalSteps}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i < step ? "bg-primary" : "bg-secondary"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Name */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <Label htmlFor="routine-name" className="text-base">
                  Qual o nome desta rotina?
                </Label>
                <Input
                  id="routine-name"
                  placeholder="Ex: Início do Expediente"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-lg"
                  autoFocus
                />
              </div>
            </motion.div>
          )}

          {/* Step 2: Trigger Type */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <Label className="text-base">Quando esta rotina deve executar?</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTriggerType('time')}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all",
                    triggerType === 'time'
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Clock className={cn("h-10 w-10", triggerType === 'time' ? "text-primary" : "text-muted-foreground")} />
                  <div className="text-center">
                    <p className="font-semibold">Em um Horário</p>
                    <p className="text-xs text-muted-foreground">
                      Executar em horário específico
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setTriggerType('startup')}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all",
                    triggerType === 'startup'
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Zap className={cn("h-10 w-10", triggerType === 'startup' ? "text-primary" : "text-muted-foreground")} />
                  <div className="text-center">
                    <p className="font-semibold">Ao Iniciar</p>
                    <p className="text-xs text-muted-foreground">
                      Quando o sistema ligar
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Time/Days Config */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              {triggerType === 'time' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-base">
                      Que horas?
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={triggerTime}
                      onChange={(e) => setTriggerTime(e.target.value)}
                      className="text-lg w-40"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base">Repetir em quais dias?</Label>
                    <div className="flex flex-wrap gap-2">
                      {weekDayOptions.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleWeekDay(day.value)}
                          className={cn(
                            "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                            weekDays.includes(day.value)
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                          )}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                    <Zap className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-lg font-medium">
                    Esta rotina executará automaticamente quando o sistema iniciar
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ideal para preparar o ambiente de trabalho
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Actions */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <Label className="text-base">
                O que fazer quando a rotina executar?
              </Label>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
                {devices.map((device) => {
                  const action = actions.find((a) => a.deviceId === device.id);
                  const isSelected = !!action;

                  return (
                    <div
                      key={device.id}
                      className={cn(
                        "flex items-center justify-between rounded-lg border p-3 transition-all",
                        isSelected ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <span className="font-medium">{device.name}</span>
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAction(device.id)}
                            className="h-8 px-2 text-muted-foreground"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant={action?.turnOn === true ? "default" : "outline"}
                          size="sm"
                          onClick={() => addAction(device.id, true)}
                          className="gap-1"
                        >
                          <Power className="h-4 w-4" />
                          Ligar
                        </Button>
                        <Button
                          type="button"
                          variant={action?.turnOn === false ? "default" : "outline"}
                          size="sm"
                          onClick={() => addAction(device.id, false)}
                          className="gap-1"
                        >
                          <PowerOff className="h-4 w-4" />
                          Desligar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {actions.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Selecione pelo menos um dispositivo
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <div>
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Voltar
              </Button>
            )}
            {step < totalSteps ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Próximo
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                {isEditing ? 'Salvar' : 'Criar Rotina'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
