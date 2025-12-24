import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Plug, Calendar } from 'lucide-react';
import { Header } from '@/components/Header';
import { DeviceCard } from '@/components/DeviceCard';
import { MasterSwitch } from '@/components/MasterSwitch';
import { DeviceFormDialog } from '@/components/DeviceFormDialog';
import { RoutineCard } from '@/components/RoutineCard';
import { RoutineWizard } from '@/components/RoutineWizard';
import { SearchInput } from '@/components/SearchInput';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDevices } from '@/hooks/useDevices';
import { useRoutines } from '@/hooks/useRoutines';
import { Device, Routine } from '@/types/device';
import { cn } from '@/lib/utils';

type DeviceFilter = 'all' | 'online' | 'offline';
type RoutineFilter = 'all' | 'active' | 'inactive';

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

  // Search and filter states
  const [deviceSearch, setDeviceSearch] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>('all');
  const [routineSearch, setRoutineSearch] = useState('');
  const [routineFilter, setRoutineFilter] = useState<RoutineFilter>('all');

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

  // Filtered and sorted devices
  const filteredDevices = useMemo(() => {
    return devices
      .filter((device) => {
        const matchesSearch = device.name.toLowerCase().includes(deviceSearch.toLowerCase());
        const matchesFilter = 
          deviceFilter === 'all' ||
          (deviceFilter === 'online' && device.status === 'online') ||
          (deviceFilter === 'offline' && device.status === 'offline');
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        // Online first, then by name
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (a.status !== 'online' && b.status === 'online') return 1;
        return a.name.localeCompare(b.name);
      });
  }, [devices, deviceSearch, deviceFilter]);

  // Filtered and sorted routines
  const filteredRoutines = useMemo(() => {
    return routines
      .filter((routine) => {
        const matchesSearch = routine.name.toLowerCase().includes(routineSearch.toLowerCase());
        const matchesFilter =
          routineFilter === 'all' ||
          (routineFilter === 'active' && routine.isActive) ||
          (routineFilter === 'inactive' && !routine.isActive);
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        // Active first, then by name
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [routines, routineSearch, routineFilter]);

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const activeRoutinesCount = routines.filter((r) => r.isActive).length;

  const filterButtonClass = (active: boolean) =>
    cn(
      "text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 rounded-lg transition-all",
      active
        ? "bg-primary text-primary-foreground"
        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
    );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-8 grid grid-cols-4 gap-2 sm:gap-4"
        >
          <div className="rounded-lg sm:rounded-xl border border-border bg-card p-2 sm:p-4">
            <p className="text-lg sm:text-2xl font-bold text-foreground">{devices.length}</p>
            <p className="text-[10px] sm:text-sm text-muted-foreground">Dispositivos</p>
          </div>
          <div className="rounded-lg sm:rounded-xl border border-border bg-card p-2 sm:p-4">
            <p className="text-lg sm:text-2xl font-bold text-primary">{onlineCount}</p>
            <p className="text-[10px] sm:text-sm text-muted-foreground">Online</p>
          </div>
          <div className="rounded-lg sm:rounded-xl border border-border bg-card p-2 sm:p-4">
            <p className="text-lg sm:text-2xl font-bold text-foreground">{routines.length}</p>
            <p className="text-[10px] sm:text-sm text-muted-foreground">Rotinas</p>
          </div>
          <div className="rounded-lg sm:rounded-xl border border-border bg-card p-2 sm:p-4">
            <p className="text-lg sm:text-2xl font-bold text-primary">{activeRoutinesCount}</p>
            <p className="text-[10px] sm:text-sm text-muted-foreground">Ativas</p>
          </div>
        </motion.div>

        <Tabs defaultValue="devices" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-card h-10 sm:h-11">
            <TabsTrigger value="devices" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Plug className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Dispositivos
            </TabsTrigger>
            <TabsTrigger value="routines" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Rotinas
            </TabsTrigger>
          </TabsList>

          {/* Devices Tab */}
          <TabsContent value="devices" className="space-y-4 sm:space-y-6">
            <MasterSwitch devices={devices} onToggleAll={toggleAllDevices} />

            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base sm:text-xl font-semibold text-foreground">
                Seus Dispositivos
              </h2>
              <Button onClick={handleAddDevice} className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4">
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Adicionar</span>
                <span className="xs:hidden">Novo</span>
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <SearchInput
                value={deviceSearch}
                onChange={setDeviceSearch}
                placeholder="Buscar dispositivo..."
                className="flex-1"
              />
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  onClick={() => setDeviceFilter('all')}
                  className={filterButtonClass(deviceFilter === 'all')}
                >
                  Todos
                </button>
                <button
                  onClick={() => setDeviceFilter('online')}
                  className={filterButtonClass(deviceFilter === 'online')}
                >
                  Online
                </button>
                <button
                  onClick={() => setDeviceFilter('offline')}
                  className={filterButtonClass(deviceFilter === 'offline')}
                >
                  Offline
                </button>
              </div>
            </div>

            <div className="grid gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDevices.map((device, index) => (
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

            {filteredDevices.length === 0 && devices.length > 0 && (
              <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 rounded-xl border border-dashed border-border py-10 sm:py-16 px-4">
                <p className="text-sm sm:text-base text-muted-foreground">
                  Nenhum dispositivo encontrado com os filtros atuais
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeviceSearch('');
                    setDeviceFilter('all');
                  }}
                  className="text-xs sm:text-sm"
                >
                  Limpar filtros
                </Button>
              </div>
            )}

            {devices.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 rounded-xl border border-dashed border-border py-10 sm:py-16 px-4">
                <Plug className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium text-foreground text-sm sm:text-base">
                    Nenhum dispositivo cadastrado
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Adicione seu primeiro dispositivo
                  </p>
                </div>
                <Button onClick={handleAddDevice} className="gap-2 text-xs sm:text-sm">
                  <Plus className="h-4 w-4" />
                  Adicionar Dispositivo
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Routines Tab */}
          <TabsContent value="routines" className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base sm:text-xl font-semibold text-foreground">
                Suas Rotinas
              </h2>
              <Button onClick={handleAddRoutine} className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4">
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Criar Rotina</span>
                <span className="xs:hidden">Nova</span>
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <SearchInput
                value={routineSearch}
                onChange={setRoutineSearch}
                placeholder="Buscar rotina..."
                className="flex-1"
              />
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  onClick={() => setRoutineFilter('all')}
                  className={filterButtonClass(routineFilter === 'all')}
                >
                  Todas
                </button>
                <button
                  onClick={() => setRoutineFilter('active')}
                  className={filterButtonClass(routineFilter === 'active')}
                >
                  Ativas
                </button>
                <button
                  onClick={() => setRoutineFilter('inactive')}
                  className={filterButtonClass(routineFilter === 'inactive')}
                >
                  Inativas
                </button>
              </div>
            </div>

            <div className="grid gap-2 sm:gap-4 sm:grid-cols-2">
              {filteredRoutines.map((routine, index) => (
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

            {filteredRoutines.length === 0 && routines.length > 0 && (
              <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 rounded-xl border border-dashed border-border py-10 sm:py-16 px-4">
                <p className="text-sm sm:text-base text-muted-foreground">
                  Nenhuma rotina encontrada com os filtros atuais
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setRoutineSearch('');
                    setRoutineFilter('all');
                  }}
                  className="text-xs sm:text-sm"
                >
                  Limpar filtros
                </Button>
              </div>
            )}

            {routines.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 rounded-xl border border-dashed border-border py-10 sm:py-16 px-4">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium text-foreground text-sm sm:text-base">
                    Nenhuma rotina criada
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Automatize seus dispositivos
                  </p>
                </div>
                <Button onClick={handleAddRoutine} className="gap-2 text-xs sm:text-sm">
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
