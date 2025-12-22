import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plug, Server, X, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Device, DeviceType } from '@/types/device';
import { cn } from '@/lib/utils';

interface DeviceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device?: Device | null;
  onSave: (device: Omit<Device, 'id'>) => void;
  onUpdate?: (id: string, updates: Partial<Device>) => void;
  onDelete?: (id: string) => void;
}

export function DeviceFormDialog({
  open,
  onOpenChange,
  device,
  onSave,
  onUpdate,
  onDelete,
}: DeviceFormDialogProps) {
  const isEditing = !!device;

  const [name, setName] = useState('');
  const [type, setType] = useState<DeviceType>('tuya');
  const [deviceId, setDeviceId] = useState('');
  const [localKey, setLocalKey] = useState('');
  const [ip, setIp] = useState('');
  const [communityString, setCommunityString] = useState('public');
  const [port, setPort] = useState('161');

  useEffect(() => {
    if (device) {
      setName(device.name);
      setType(device.type);
      setDeviceId(device.deviceId || '');
      setLocalKey(device.localKey || '');
      setIp(device.ip || '');
      setCommunityString(device.communityString || 'public');
      setPort(device.port?.toString() || '161');
    } else {
      setName('');
      setType('tuya');
      setDeviceId('');
      setLocalKey('');
      setIp('');
      setCommunityString('public');
      setPort('161');
    }
  }, [device, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const baseDevice = {
      name,
      type,
      isOn: device?.isOn ?? false,
      status: device?.status ?? ('online' as const),
    };

    if (type === 'tuya') {
      const newDevice: Omit<Device, 'id'> = {
        ...baseDevice,
        deviceId,
        localKey,
      };
      if (isEditing && onUpdate) {
        onUpdate(device.id, newDevice);
      } else {
        onSave(newDevice);
      }
    } else {
      const newDevice: Omit<Device, 'id'> = {
        ...baseDevice,
        ip,
        communityString,
        port: parseInt(port, 10),
      };
      if (isEditing && onUpdate) {
        onUpdate(device.id, newDevice);
      } else {
        onSave(newDevice);
      }
    }

    onOpenChange(false);
  };

  const handleDelete = () => {
    if (device && onDelete) {
      onDelete(device.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Dispositivo' : 'Adicionar Dispositivo'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do dispositivo.'
              : 'Preencha os dados para cadastrar um novo dispositivo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Device Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome Amigável</Label>
            <Input
              id="name"
              placeholder="Ex: Tomada do Servidor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Device Type Selection */}
          <div className="space-y-2">
            <Label>Tipo de Dispositivo</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('tuya')}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200",
                  type === 'tuya'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
                )}
              >
                <Plug className="h-6 w-6" />
                <span className="text-sm font-medium">Tuya</span>
                <span className="text-xs opacity-70">Tomadas Inteligentes</span>
              </button>
              <button
                type="button"
                onClick={() => setType('snmp')}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200",
                  type === 'snmp'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
                )}
              >
                <Server className="h-6 w-6" />
                <span className="text-sm font-medium">SNMP</span>
                <span className="text-xs opacity-70">Réguas de Rede</span>
              </button>
            </div>
          </div>

          {/* Dynamic Fields based on type */}
          <AnimatePresence mode="wait">
            {type === 'tuya' ? (
              <motion.div
                key="tuya"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="deviceId">Device ID</Label>
                  <Input
                    id="deviceId"
                    placeholder="ID do dispositivo Tuya"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="localKey">Local Key</Label>
                  <Input
                    id="localKey"
                    placeholder="Chave local do dispositivo"
                    value={localKey}
                    onChange={(e) => setLocalKey(e.target.value)}
                    required
                    type="password"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="snmp"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="ip">Endereço IP</Label>
                  <Input
                    id="ip"
                    placeholder="192.168.1.100"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="community">Community String</Label>
                    <Input
                      id="community"
                      placeholder="public"
                      value={communityString}
                      onChange={(e) => setCommunityString(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port">Porta</Label>
                    <Input
                      id="port"
                      placeholder="161"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      type="number"
                      required
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:mr-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? 'Salvar Alterações' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
