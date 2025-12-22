import { motion } from 'framer-motion';
import { Clock, Zap, Calendar, Power, PowerOff, Edit2 } from 'lucide-react';
import { Routine, Device, WeekDay } from '@/types/device';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RoutineCardProps {
  routine: Routine;
  devices: Device[];
  onToggle: (id: string) => void;
  onEdit?: (routine: Routine) => void;
}

const weekDayLabels: Record<WeekDay, string> = {
  seg: 'Seg',
  ter: 'Ter',
  qua: 'Qua',
  qui: 'Qui',
  sex: 'Sex',
  sab: 'Sáb',
  dom: 'Dom',
};

const allWeekDays: WeekDay[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

export function RoutineCard({ routine, devices, onToggle, onEdit }: RoutineCardProps) {
  const getDeviceName = (deviceId: string) => {
    return devices.find((d) => d.id === deviceId)?.name || 'Dispositivo removido';
  };

  const TriggerIcon = routine.triggerType === 'time' ? Clock : Zap;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border bg-card p-3 sm:p-5 card-hover",
        routine.isActive ? "border-primary/30" : "border-border opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="flex items-start gap-2 sm:gap-4 min-w-0 flex-1">
          {/* Trigger Icon */}
          <div
            className={cn(
              "flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-colors",
              routine.isActive ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
            )}
          >
            <TriggerIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>

          <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{routine.name}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {routine.triggerType === 'time' ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  Às {routine.triggerTime}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  Ao iniciar
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit?.(routine)}
            className="h-7 w-7 sm:h-8 sm:w-8"
          >
            <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Switch
            checked={routine.isActive}
            onCheckedChange={() => onToggle(routine.id)}
            aria-label={`${routine.isActive ? 'Desativar' : 'Ativar'} ${routine.name}`}
          />
        </div>
      </div>

      {/* Week days */}
      {routine.triggerType === 'time' && (
        <div className="mt-3 sm:mt-4 flex items-center gap-1.5 sm:gap-2">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
          <div className="flex gap-0.5 sm:gap-1 flex-wrap">
            {allWeekDays.map((day) => (
              <span
                key={day}
                className={cn(
                  "flex h-5 w-6 sm:h-6 sm:w-8 items-center justify-center rounded text-[10px] sm:text-xs font-medium transition-colors",
                  routine.weekDays.includes(day)
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {weekDayLabels[day]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions list */}
      <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
        <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Ações
        </p>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {routine.actions.map((action, index) => (
            <span
              key={index}
              className={cn(
                "inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium",
                action.turnOn
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {action.turnOn ? (
                <Power className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              ) : (
                <PowerOff className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              )}
              <span className="truncate max-w-[80px] sm:max-w-none">{getDeviceName(action.deviceId)}</span>
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
