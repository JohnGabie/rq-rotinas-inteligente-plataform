import { motion } from 'framer-motion';
import { Zap, Moon, Sun, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { useActivityLog } from '@/hooks/useActivityLog';
import { ActivityLogPanel } from '@/components/ActivityLogPanel';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { enabled: notificationsEnabled, toggleNotifications, permission } = useNotifications();
  const { logs, clearLogs } = useActivityLog();
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 sm:gap-3"
        >
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-primary/20">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground">Rotinas Inteligentes</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden xs:block">Gerenciador de Automação</p>
          </div>
        </motion.div>

        <nav className="flex items-center gap-1.5 sm:gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleNotifications}
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  aria-label={notificationsEnabled ? 'Desativar notificações' : 'Ativar notificações'}
                >
                  <motion.div
                    key={notificationsEnabled ? 'on' : 'off'}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {notificationsEnabled ? (
                      <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    ) : (
                      <BellOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </motion.div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {permission === 'denied' 
                  ? 'Notificações bloqueadas pelo navegador'
                  : notificationsEnabled 
                    ? 'Notificações ativadas' 
                    : 'Ativar notificações'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <ActivityLogPanel logs={logs} onClear={clearLogs} />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 sm:h-9 sm:w-9"
            aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          >
            <motion.div
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </motion.div>
          </Button>
          
          <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-primary/20 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
            <span className="hidden xs:inline">Sistema</span> Ativo
          </span>
        </nav>
      </div>
    </header>
  );
}

