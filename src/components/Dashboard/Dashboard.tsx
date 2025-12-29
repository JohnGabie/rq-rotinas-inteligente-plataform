import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Loader2 } from 'lucide-react';
import { useSmartOffice } from '@/hooks/useSmartOffice';
import { DashboardHeader } from './DashboardHeader';
import { MonitoringPanel } from './MonitoringPanel';
import { DashboardDeviceCard } from './DashboardDeviceCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const Dashboard: React.FC = () => {
  const {
    devices,
    isConnected,
    isMonitoring,
    monitoringStatus,
    isLoading,
    controlSnmpOutlet,
    controlTuyaDevice,
    startMonitoring,
    stopMonitoring,
  } = useSmartOffice();

  const handleDeviceToggle = async (id: string, state: boolean) => {
    const device = devices.find((d) => 
      (d.type === 'snmp' && String(d.outletNumber) === id) ||
      (d.type === 'tuya' && d.deviceId === id)
    );

    if (!device) return;

    if (device.type === 'snmp') {
      await controlSnmpOutlet(Number(id), state);
    } else {
      await controlTuyaDevice(id, state);
    }
  };

  const tuyaDevices = devices.filter((d) => d.type === 'tuya');
  const snmpDevices = devices.filter((d) => d.type === 'snmp');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <DashboardHeader isConnected={isConnected} isMonitoring={isMonitoring} />

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* Monitoring Panel */}
        <MonitoringPanel
          isMonitoring={isMonitoring}
          status={monitoringStatus}
          onStart={startMonitoring}
          onStop={stopMonitoring}
        />

        {/* Devices Grid */}
        <Card className="backdrop-blur-xl bg-card/80 border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Dispositivos</CardTitle>
                <CardDescription>
                  {devices.length} dispositivo{devices.length !== 1 ? 's' : ''} configurado{devices.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : devices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Cpu className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum dispositivo encontrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure seus dispositivos no backend
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Tuya Devices */}
                {tuyaDevices.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Dispositivos Tuya
                    </h3>
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: { transition: { staggerChildren: 0.05 } },
                      }}
                    >
                      {tuyaDevices.map((device) => (
                        <DashboardDeviceCard
                          key={device.id}
                          device={device}
                          onToggle={handleDeviceToggle}
                        />
                      ))}
                    </motion.div>
                  </div>
                )}

                {/* SNMP Devices */}
                {snmpDevices.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-400" />
                      Dispositivos SNMP
                    </h3>
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: { transition: { staggerChildren: 0.05 } },
                      }}
                    >
                      {snmpDevices.map((device) => (
                        <DashboardDeviceCard
                          key={device.id}
                          device={device}
                          onToggle={handleDeviceToggle}
                        />
                      ))}
                    </motion.div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
