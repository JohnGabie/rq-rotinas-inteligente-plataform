import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Power, Loader2, Wifi, WifiOff } from 'lucide-react';
import type { Device } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardDeviceCardProps {
  device: Device;
  onToggle: (deviceId: string, state: boolean) => Promise<void>;
}

export const DashboardDeviceCard: React.FC<DashboardDeviceCardProps> = ({
  device,
  onToggle,
}) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      if (device.type === 'snmp' && device.outletNumber !== undefined) {
        await onToggle(String(device.outletNumber), !device.isOn);
      } else if (device.type === 'tuya' && device.deviceId) {
        await onToggle(device.deviceId, !device.isOn);
      }
    } finally {
      setIsToggling(false);
    }
  };

  const isOnline = device.status === 'online';
  const isOn = device.isOn;

  const formatLastUpdate = (timestamp?: string): string => {
    if (!timestamp) return 'Nunca';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card 
        className={cn(
          'backdrop-blur-xl border-border/50 transition-all duration-300 overflow-hidden',
          isOn && isOnline && 'bg-primary/5 border-primary/30 shadow-lg shadow-primary/10',
          !isOnline && 'opacity-60'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Status LED */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div 
                  className={cn(
                    'w-3 h-3 rounded-full transition-all duration-300',
                    isOn && isOnline && 'bg-primary',
                    !isOn && isOnline && 'bg-muted-foreground',
                    !isOnline && 'bg-destructive'
                  )}
                />
                {isOn && isOnline && (
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary animate-ping opacity-75" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground truncate">{device.name}</h3>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'text-xs uppercase',
                      device.type === 'tuya' 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                        : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                    )}
                  >
                    {device.type}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  {isOnline ? (
                    <Wifi className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-destructive" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {isOnline ? 'Online' : 'Offline'} • {formatLastUpdate(device.lastUpdate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Power button */}
            <Button
              size="icon"
              variant={isOn ? 'default' : 'outline'}
              className={cn(
                'h-12 w-12 rounded-full transition-all duration-300',
                isOn && 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30',
                !isOn && 'bg-secondary hover:bg-secondary/80'
              )}
              disabled={!isOnline || isToggling}
              onClick={handleToggle}
            >
              {isToggling ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Power className={cn('h-5 w-5', isOn ? 'text-primary-foreground' : 'text-muted-foreground')} />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardDeviceCard;
