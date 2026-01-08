import { motion } from 'framer-motion';
import { Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Device } from '@/types/device';

interface MasterSwitchProps {
  devices: Device[];
  onToggleAll: (turnOn: boolean) => void;
}

export function MasterSwitch({ devices, onToggleAll }: MasterSwitchProps) {
  const onlineDevices = devices.filter((d) => d.status === 'online');
  const onlineOnCount = onlineDevices.filter((d) => d.isOn).length;
  const allOn = onlineOnCount === onlineDevices.length && onlineDevices.length > 0;
  const someOn = onlineOnCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-border bg-card p-4 sm:p-6 sm:flex-row sm:justify-between"
    >
      <div className="text-center sm:text-left">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">
          Controle Geral
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {onlineOnCount} de {onlineDevices.length} dispositivos ligados
        </p>
      </div>

      <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
        <Button
          variant="master"
          size="default"
          onClick={() => onToggleAll(true)}
          disabled={allOn}
          className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-11 px-3 sm:px-4"
        >
          <Power className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden xs:inline">Ligar</span> Tudo
        </Button>
        <Button
          variant="masterOff"
          size="default"
          onClick={() => onToggleAll(false)}
          disabled={!someOn}
          className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-11 px-3 sm:px-4"
        >
          <PowerOff className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden xs:inline">Desligar</span> Tudo
        </Button>
      </div>
    </motion.div>
  );
}
