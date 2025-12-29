import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Activity, Play, Square, Loader2, Monitor, Clock, RefreshCw } from 'lucide-react';
import type { MonitoringConfig, MonitoringStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';

const monitoringSchema = z.object({
  gatewayIp: z.string()
    .min(1, 'IP é obrigatório')
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'IP inválido'),
  pingInterval: z.number()
    .min(5, 'Mínimo 5 segundos')
    .max(300, 'Máximo 300 segundos'),
  maxRetries: z.number()
    .min(1, 'Mínimo 1 tentativa')
    .max(10, 'Máximo 10 tentativas'),
});

type MonitoringFormData = z.infer<typeof monitoringSchema>;

interface MonitoringPanelProps {
  isMonitoring: boolean;
  status: MonitoringStatus | null;
  onStart: (config: MonitoringConfig) => Promise<void>;
  onStop: () => Promise<void>;
}

export const MonitoringPanel: React.FC<MonitoringPanelProps> = ({
  isMonitoring,
  status,
  onStart,
  onStop,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MonitoringFormData>({
    resolver: zodResolver(monitoringSchema),
    defaultValues: {
      gatewayIp: '192.168.1.100',
      pingInterval: 30,
      maxRetries: 3,
    },
  });

  const handleStart = async (data: MonitoringFormData) => {
    setIsSubmitting(true);
    try {
      await onStart({
        gatewayIp: data.gatewayIp,
        pingInterval: data.pingInterval,
        maxRetries: data.maxRetries,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStop = async () => {
    setIsSubmitting(true);
    try {
      await onStop();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPcStatusColor = () => {
    if (!status) return 'bg-muted text-muted-foreground';
    switch (status.pcStatus) {
      case 'online':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'offline':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPcStatusText = () => {
    if (!status) return 'Desconhecido';
    switch (status.pcStatus) {
      case 'online':
        return 'PC Online';
      case 'offline':
        return 'PC Offline';
      default:
        return 'Verificando...';
    }
  };

  return (
    <Card className="backdrop-blur-xl bg-card/80 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Monitoramento</CardTitle>
              <CardDescription>Configuração do gateway</CardDescription>
            </div>
          </div>
          
          {/* Status badge */}
          <Badge variant="outline" className={getPcStatusColor()}>
            <Monitor className="h-3 w-3 mr-1" />
            {getPcStatusText()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleStart)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="gatewayIp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground text-sm">IP do Gateway</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="192.168.1.100"
                        className="bg-input/50 border-border/50"
                        disabled={isMonitoring || isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pingInterval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground text-sm flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Intervalo (s)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={5}
                        max={300}
                        className="bg-input/50 border-border/50"
                        disabled={isMonitoring || isSubmitting}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxRetries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground text-sm flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      Tentativas
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        className="bg-input/50 border-border/50"
                        disabled={isMonitoring || isSubmitting}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Control buttons */}
            <div className="flex gap-3">
              {!isMonitoring ? (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    Iniciar Monitoramento
                  </Button>
                </motion.div>
              ) : (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleStop}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Square className="mr-2 h-4 w-4" />
                    )}
                    Parar Monitoramento
                  </Button>
                </motion.div>
              )}
            </div>
          </form>
        </Form>

        {/* Status info */}
        {status && (
          <div className="pt-4 border-t border-border/50">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium text-foreground">
                  {status.isRunning ? 'Em execução' : 'Parado'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">PC</p>
                <p className={`font-medium ${status.pcStatus === 'online' ? 'text-primary' : 'text-destructive'}`}>
                  {getPcStatusText()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Falhas</p>
                <p className="font-medium text-foreground">{status.failedAttempts}</p>
              </div>
              {status.lastCheck && (
                <div>
                  <p className="text-muted-foreground">Última verificação</p>
                  <p className="font-medium text-foreground">
                    {new Date(status.lastCheck).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonitoringPanel;
