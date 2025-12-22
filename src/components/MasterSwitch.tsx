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
      className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:justify-between"
    >
      <div className="text-center sm:text-left">
        <h2 className="text-lg font-semibold text-foreground">
          Controle Geral
        </h2>
        <p className="text-sm text-muted-foreground">
          {onlineOnCount} de {onlineDevices.length} dispositivos ligados
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          variant="master"
          size="lg"
          onClick={() => onToggleAll(true)}
          disabled={allOn}
          className="gap-2"
        >
          <Power className="h-5 w-5" />
          Ligar Tudo
        </Button>
        <Button
          variant="masterOff"
          size="lg"
          onClick={() => onToggleAll(false)}
          disabled={!someOn}
          className="gap-2"
        >
          <PowerOff className="h-5 w-5" />
          Desligar Tudo
        </Button>
      </div>
    </motion.div>
  );
}
