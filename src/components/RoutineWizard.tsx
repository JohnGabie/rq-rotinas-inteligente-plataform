import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, Power, PowerOff, X, ChevronLeft, ChevronRight, Check, Trash2 } from 'lucide-react';
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
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const handleDeleteConfirm = () => {
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {isEditing ? 'Editar Rotina' : 'Criar Nova Rotina'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
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
                className="space-y-4 py-3 sm:py-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="routine-name" className="text-sm sm:text-base">
                    Qual o nome desta rotina?
                  </Label>
                  <Input
                    id="routine-name"
                    placeholder="Ex: Início do Expediente"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-base sm:text-lg"
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
                className="space-y-4 py-3 sm:py-4"
              >
                <Label className="text-sm sm:text-base">Quando esta rotina deve executar?</Label>
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setTriggerType('time')}
                    className={cn(
                      "flex flex-col items-center gap-2 sm:gap-3 rounded-xl border-2 p-4 sm:p-6 transition-all",
                      triggerType === 'time'
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Clock className={cn("h-8 w-8 sm:h-10 sm:w-10", triggerType === 'time' ? "text-primary" : "text-muted-foreground")} />
                    <div className="text-center">
                      <p className="font-semibold text-sm sm:text-base">Em um Horário</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Horário específico
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTriggerType('startup')}
                    className={cn(
                      "flex flex-col items-center gap-2 sm:gap-3 rounded-xl border-2 p-4 sm:p-6 transition-all",
                      triggerType === 'startup'
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Zap className={cn("h-8 w-8 sm:h-10 sm:w-10", triggerType === 'startup' ? "text-primary" : "text-muted-foreground")} />
                    <div className="text-center">
                      <p className="font-semibold text-sm sm:text-base">Ao Iniciar</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Sistema ligar
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
                className="space-y-4 sm:space-y-6 py-3 sm:py-4"
              >
                {triggerType === 'time' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-sm sm:text-base">
                        Que horas?
                      </Label>
                      <Input
                        id="time"
                        type="time"
                        value={triggerTime}
                        onChange={(e) => setTriggerTime(e.target.value)}
                        className="text-base sm:text-lg w-32 sm:w-40"
                      />
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <Label className="text-sm sm:text-base">Repetir em quais dias?</Label>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {weekDayOptions.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleWeekDay(day.value)}
                            className={cn(
                              "rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all",
                              weekDays.includes(day.value)
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                            )}
                          >
                            {day.label.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 sm:gap-4 py-6 sm:py-8 text-center">
                    <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-primary/20">
                      <Zap className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                    </div>
                    <p className="text-base sm:text-lg font-medium">
                      Executará quando o sistema iniciar
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Ideal para preparar o ambiente
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
                className="space-y-3 sm:space-y-4 py-3 sm:py-4"
              >
                <Label className="text-sm sm:text-base">
                  O que fazer quando a rotina executar?
                </Label>
                <div className="max-h-48 sm:max-h-64 space-y-2 overflow-y-auto pr-1 sm:pr-2">
                  {devices.map((device) => {
                    const action = actions.find((a) => a.deviceId === device.id);
                    const isSelected = !!action;

                    return (
                      <div
                        key={device.id}
                        className={cn(
                          "flex flex-col xs:flex-row xs:items-center justify-between gap-2 rounded-lg border p-2 sm:p-3 transition-all",
                          isSelected ? "border-primary bg-primary/5" : "border-border"
                        )}
                      >
                        <span className="font-medium text-sm sm:text-base truncate">{device.name}</span>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {isSelected && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAction(device.id)}
                              className="h-7 sm:h-8 px-2 text-muted-foreground"
                            >
                              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant={action?.turnOn === true ? "default" : "outline"}
                            size="sm"
                            onClick={() => addAction(device.id, true)}
                            className="gap-1 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                          >
                            <Power className="h-3 w-3 sm:h-4 sm:w-4" />
                            Ligar
                          </Button>
                          <Button
                            type="button"
                            variant={action?.turnOn === false ? "default" : "outline"}
                            size="sm"
                            onClick={() => addAction(device.id, false)}
                            className="gap-1 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                          >
                            <PowerOff className="h-3 w-3 sm:h-4 sm:w-4" />
                            Desligar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {actions.length === 0 && (
                  <p className="text-center text-xs sm:text-sm text-muted-foreground">
                    Selecione pelo menos um dispositivo
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3 sm:pt-4 gap-2">
            <div>
              {isEditing && onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"
                >
                  <Trash2 className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Remover</span>
                </Button>
              )}
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4">
                  <ChevronLeft className="mr-0.5 sm:mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Voltar
                </Button>
              )}
              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"
                >
                  Próximo
                  <ChevronRight className="ml-0.5 sm:ml-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canProceed()}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"
                >
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {isEditing ? 'Salvar' : 'Criar'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remover rotina?"
        description={`Tem certeza que deseja remover "${routine?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
