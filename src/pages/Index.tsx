import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Plug, Calendar } from 'lucide-react';
import { Header } from '@/components/Header';
import { DeviceCard } from '@/components/DeviceCard';
import { MasterSwitch } from '@/components/MasterSwitch';
import { DeviceFormDialog } from '@/components/DeviceFormDialog';
import { RoutineCard } from '@/components/RoutineCard';
import { RoutineWizard } from '@/components/RoutineWizard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDevices } from '@/hooks/useDevices';
import { useRoutines } from '@/hooks/useRoutines';
import { Device, Routine } from '@/types/device';

const Index = () => {
  const {
    devices,
    toggleDevice,
    toggleAllDevices,
    addDevice,
    updateDevice,
    deleteDevice,
  } = useDevices();

  const {
    routines,
    toggleRoutine,
    addRoutine,
    updateRoutine,
    deleteRoutine,
  } = useRoutines();

  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const [routineWizardOpen, setRoutineWizardOpen] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);

  const handleEditDevice = (device: Device) => {
    setSelectedDevice(device);
    setDeviceDialogOpen(true);
  };

  const handleAddDevice = () => {
    setSelectedDevice(null);
    setDeviceDialogOpen(true);
  };

  const handleEditRoutine = (routine: Routine) => {
    setSelectedRoutine(routine);
    setRoutineWizardOpen(true);
  };

  const handleAddRoutine = () => {
    setSelectedRoutine(null);
    setRoutineWizardOpen(true);
  };

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const activeRoutinesCount = routines.filter((r) => r.isActive).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">{devices.length}</p>
            <p className="text-sm text-muted-foreground">Dispositivos</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-primary">{onlineCount}</p>
            <p className="text-sm text-muted-foreground">Online</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">{routines.length}</p>
            <p className="text-sm text-muted-foreground">Rotinas</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-primary">{activeRoutinesCount}</p>
            <p className="text-sm text-muted-foreground">Ativas</p>
          </div>
        </motion.div>

        <Tabs defaultValue="devices" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-card">
            <TabsTrigger value="devices" className="gap-2">
              <Plug className="h-4 w-4" />
              Dispositivos
            </TabsTrigger>
            <TabsTrigger value="routines" className="gap-2">
              <Calendar className="h-4 w-4" />
              Rotinas
            </TabsTrigger>
          </TabsList>

          {/* Devices Tab */}
          <TabsContent value="devices" className="space-y-6">
            <MasterSwitch devices={devices} onToggleAll={toggleAllDevices} />

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Seus Dispositivos
              </h2>
              <Button onClick={handleAddDevice} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {devices.map((device, index) => (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <DeviceCard
                    device={device}
                    onToggle={toggleDevice}
                    onEdit={handleEditDevice}
                  />
                </motion.div>
              ))}
            </div>

            {devices.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-16">
                <Plug className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium text-foreground">
                    Nenhum dispositivo cadastrado
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Adicione seu primeiro dispositivo para começar
                  </p>
                </div>
                <Button onClick={handleAddDevice} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Dispositivo
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Routines Tab */}
          <TabsContent value="routines" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Suas Rotinas
              </h2>
              <Button onClick={handleAddRoutine} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Rotina
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {routines.map((routine, index) => (
                <motion.div
                  key={routine.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <RoutineCard
                    routine={routine}
                    devices={devices}
                    onToggle={toggleRoutine}
                    onEdit={handleEditRoutine}
                  />
                </motion.div>
              ))}
            </div>

            {routines.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-16">
                <Calendar className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium text-foreground">
                    Nenhuma rotina criada
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Automatize seus dispositivos criando rotinas
                  </p>
                </div>
                <Button onClick={handleAddRoutine} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Rotina
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <DeviceFormDialog
        open={deviceDialogOpen}
        onOpenChange={setDeviceDialogOpen}
        device={selectedDevice}
        onSave={addDevice}
        onUpdate={updateDevice}
        onDelete={deleteDevice}
      />

      <RoutineWizard
        open={routineWizardOpen}
        onOpenChange={setRoutineWizardOpen}
        routine={selectedRoutine}
        devices={devices}
        onSave={addRoutine}
        onUpdate={updateRoutine}
        onDelete={deleteRoutine}
      />
    </div>
  );
};

export default Index;
