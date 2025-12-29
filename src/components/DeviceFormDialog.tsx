import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plug, Server, Trash2 } from 'lucide-react';
import { z } from 'zod';
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
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { toast } from '@/hooks/use-toast';

// Validation schemas
const baseDeviceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome deve ter no máximo 50 caracteres'),
});

const tuyaDeviceSchema = baseDeviceSchema.extend({
  deviceId: z.string().min(1, 'Device ID é obrigatório').max(64, 'Device ID deve ter no máximo 64 caracteres'),
  localKey: z.string().min(1, 'Local Key é obrigatória').max(64, 'Local Key deve ter no máximo 64 caracteres'),
});

const snmpDeviceSchema = baseDeviceSchema.extend({
  ip: z.string().ip({ message: 'Endereço IP inválido' }),
  communityString: z.string().min(1, 'Community é obrigatório').max(50, 'Community deve ter no máximo 50 caracteres'),
  port: z.number().int().min(1, 'Porta deve ser entre 1 e 65535').max(65535, 'Porta deve ser entre 1 e 65535'),
});

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const baseDevice = {
      name,
      type,
      isOn: device?.isOn ?? false,
      status: device?.status ?? ('online' as const),
    };

    try {
      if (type === 'tuya') {
        tuyaDeviceSchema.parse({ name, deviceId, localKey });
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
        const portNumber = parseInt(port, 10);
        snmpDeviceSchema.parse({ name, ip, communityString, port: portNumber });
        const newDevice: Omit<Device, 'id'> = {
          ...baseDevice,
          ip,
          communityString,
          port: portNumber,
        };
        if (isEditing && onUpdate) {
          onUpdate(device.id, newDevice);
        } else {
          onSave(newDevice);
        }
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        toast({
          title: 'Dados inválidos',
          description: 'Verifique os campos destacados.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDeleteConfirm = () => {
    if (device && onDelete) {
      onDelete(device.id);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-x-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {isEditing ? 'Editar Dispositivo' : 'Adicionar Dispositivo'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {isEditing
                ? 'Atualize as informações do dispositivo.'
                : 'Preencha os dados para cadastrar um novo dispositivo.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Device Name */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="name" className="text-xs sm:text-sm">Nome Amigável</Label>
              <Input
                id="name"
                placeholder="Ex: Tomada do Servidor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                autoComplete="off"
                className={cn("text-sm sm:text-base", validationErrors.name && "border-destructive")}
              />
              {validationErrors.name && (
                <p className="text-xs text-destructive">{validationErrors.name}</p>
              )}
            </div>

            {/* Device Type Selection */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Tipo de Dispositivo</Label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setType('tuya')}
                  className={cn(
                    "flex flex-col items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border-2 p-3 sm:p-4 transition-all duration-200",
                    type === 'tuya'
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <Plug className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-xs sm:text-sm font-medium">Tuya</span>
                  <span className="text-[10px] sm:text-xs opacity-70 hidden xs:block">Tomadas Inteligentes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('snmp')}
                  className={cn(
                    "flex flex-col items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border-2 p-3 sm:p-4 transition-all duration-200",
                    type === 'snmp'
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <Server className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-xs sm:text-sm font-medium">SNMP</span>
                  <span className="text-[10px] sm:text-xs opacity-70 hidden xs:block">Réguas de Rede</span>
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
                  className="space-y-3 sm:space-y-4"
                >
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="deviceId" className="text-xs sm:text-sm">Device ID</Label>
                    <Input
                      id="deviceId"
                      placeholder="ID do dispositivo Tuya"
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                      maxLength={64}
                      autoComplete="off"
                      className={cn("text-sm sm:text-base", validationErrors.deviceId && "border-destructive")}
                    />
                    {validationErrors.deviceId && (
                      <p className="text-xs text-destructive">{validationErrors.deviceId}</p>
                    )}
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="localKey" className="text-xs sm:text-sm">Local Key</Label>
                    <Input
                      id="localKey"
                      placeholder="Chave local do dispositivo"
                      value={localKey}
                      onChange={(e) => setLocalKey(e.target.value)}
                      maxLength={64}
                      type="password"
                      autoComplete="off"
                      data-form-type="other"
                      className={cn("text-sm sm:text-base", validationErrors.localKey && "border-destructive")}
                    />
                    {validationErrors.localKey && (
                      <p className="text-xs text-destructive">{validationErrors.localKey}</p>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="snmp"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3 sm:space-y-4"
                >
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="ip" className="text-xs sm:text-sm">Endereço IP</Label>
                    <Input
                      id="ip"
                      placeholder="192.168.1.100"
                      value={ip}
                      onChange={(e) => setIp(e.target.value)}
                      autoComplete="off"
                      className={cn("text-sm sm:text-base", validationErrors.ip && "border-destructive")}
                    />
                    {validationErrors.ip && (
                      <p className="text-xs text-destructive">{validationErrors.ip}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="community" className="text-xs sm:text-sm">Community</Label>
                      <Input
                        id="community"
                        placeholder="public"
                        value={communityString}
                        onChange={(e) => setCommunityString(e.target.value)}
                        maxLength={50}
                        autoComplete="off"
                        className={cn("text-sm sm:text-base", validationErrors.communityString && "border-destructive")}
                      />
                      {validationErrors.communityString && (
                        <p className="text-xs text-destructive">{validationErrors.communityString}</p>
                      )}
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="port" className="text-xs sm:text-sm">Porta</Label>
                      <Input
                        id="port"
                        placeholder="161"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        type="number"
                        min={1}
                        max={65535}
                        autoComplete="off"
                        className={cn("text-sm sm:text-base", validationErrors.port && "border-destructive")}
                      />
                      {validationErrors.port && (
                        <p className="text-xs text-destructive">{validationErrors.port}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <DialogFooter className="flex-col gap-2 sm:flex-row pt-2">
              {isEditing && onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:mr-auto text-xs sm:text-sm h-8 sm:h-10"
                >
                  <Trash2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Remover
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="text-xs sm:text-sm h-8 sm:h-10">
                Cancelar
              </Button>
              <Button type="submit" className="text-xs sm:text-sm h-8 sm:h-10">
                {isEditing ? 'Salvar Alterações' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remover dispositivo?"
        description={`Tem certeza que deseja remover "${device?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
