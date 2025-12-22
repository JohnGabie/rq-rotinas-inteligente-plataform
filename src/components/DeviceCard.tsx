import { motion } from 'framer-motion';
import { Power, Wifi, WifiOff, Plug, Server } from 'lucide-react';
import { Device } from '@/types/device';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface DeviceCardProps {
  device: Device;
  onToggle: (id: string) => void;
  onEdit?: (device: Device) => void;
}

export function DeviceCard({ device, onToggle, onEdit }: DeviceCardProps) {
  const isOnline = device.status === 'online';
  const isOn = device.isOn && isOnline;

  const DeviceIcon = device.type === 'tuya' ? Plug : Server;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-5 card-hover cursor-pointer",
        isOn ? "border-primary/30 device-glow-on" : "border-border",
        !isOnline && "opacity-60"
      )}
      onClick={() => onEdit?.(device)}
    >
      {/* Glow effect background */}
      {isOn && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      )}

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Device Icon with status indicator */}
          <div
            className={cn(
              "relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300",
              isOn ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
            )}
          >
            <DeviceIcon className="h-6 w-6" />
            {/* Power indicator dot */}
            <span
              className={cn(
                "absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-card transition-colors duration-300",
                isOn ? "bg-primary animate-pulse-glow" : "bg-device-off"
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-foreground">{device.name}</h3>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium",
                  isOnline ? "text-primary" : "text-device-offline"
                )}
              >
                {isOnline ? (
                  <Wifi className="h-3 w-3" />
                ) : (
                  <WifiOff className="h-3 w-3" />
                )}
                {isOnline ? "Online" : "Desconectado"}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground uppercase">
                {device.type}
              </span>
            </div>
          </div>
        </div>

        {/* Toggle Switch */}
        <div
          className="flex flex-col items-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Switch
            checked={isOn}
            onCheckedChange={() => onToggle(device.id)}
            disabled={!isOnline}
            aria-label={`${isOn ? 'Desligar' : 'Ligar'} ${device.name}`}
          />
          <span className="text-xs text-muted-foreground">
            {isOn ? 'Ligado' : 'Desligado'}
          </span>
        </div>
      </div>

      {/* Bottom status bar */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-1 transition-all duration-500",
          isOn ? "bg-gradient-to-r from-primary/50 via-primary to-primary/50" : "bg-transparent"
        )}
      />
    </motion.div>
  );
}
