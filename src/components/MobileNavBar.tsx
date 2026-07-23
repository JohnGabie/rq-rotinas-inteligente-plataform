import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plug, Calendar, History, Menu, Moon, Sun, Bell, BellOff, Users, LogOut } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ActivityLogPanel } from '@/components/ActivityLogPanel';
import { UserManagementDialog } from '@/components/UserManagementDialog';
import { useTheme } from '@/hooks/useTheme';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useAuthContext } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export type MainTab = 'devices' | 'routines';

interface MobileNavBarProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

/**
 * Barra de navegação inferior, exibida apenas no mobile (oculta a partir de md).
 * Concentra as duas seções principais e os acessos que no desktop ficam no header,
 * mantendo-os ao alcance do polegar.
 */
export function MobileNavBar({ activeTab, onTabChange }: MobileNavBarProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const { enabled: notificationsEnabled, toggleNotifications, permission } = useNotificationContext();
  const { logs, clearLogs } = useActivityLog();
  const { logout, user } = useAuthContext();
  const isMobile = useIsMobile();

  // Sheets/Dialogs renderizam em portal, então o `md:hidden` da <nav> não os
  // alcança: ao passar para desktop um painel aberto continuaria na tela.
  useEffect(() => {
    if (!isMobile) {
      setHistoryOpen(false);
      setMoreOpen(false);
      setUsersOpen(false);
    }
  }, [isMobile]);

  const items = [
    {
      key: 'devices',
      label: 'Dispositivos',
      icon: Plug,
      active: activeTab === 'devices',
      onClick: () => onTabChange('devices'),
    },
    {
      key: 'routines',
      label: 'Rotinas',
      icon: Calendar,
      active: activeTab === 'routines',
      onClick: () => onTabChange('routines'),
    },
    {
      key: 'history',
      label: 'Histórico',
      icon: History,
      active: historyOpen,
      badge: logs.length,
      onClick: () => setHistoryOpen(true),
    },
    {
      key: 'more',
      label: 'Mais',
      icon: Menu,
      active: moreOpen,
      onClick: () => setMoreOpen(true),
    },
  ] as const;

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 md:hidden',
          'border-t border-border bg-card/80 backdrop-blur-lg',
          // Respeita a área segura de aparelhos com gesture bar
          'pb-[env(safe-area-inset-bottom)]'
        )}
      >
        <ul className="grid grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon;
            const badge = 'badge' in item ? item.badge : 0;

            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={item.onClick}
                  aria-current={item.active ? 'page' : undefined}
                  className={cn(
                    'relative flex h-16 w-full flex-col items-center justify-center gap-1',
                    'transition-colors focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-ring focus-visible:ring-inset',
                    item.active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {/* Indicador da seção ativa, deslizando entre os itens */}
                  {item.active && (
                    <motion.span
                      layoutId="mobile-nav-indicator"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary"
                    />
                  )}

                  <span className="relative">
                    <Icon className="h-5 w-5" />
                    {badge > 0 && (
                      <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </span>

                  <span className="text-[10px] font-medium leading-none">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Histórico: mesmo painel do desktop, aberto pela barra */}
      <ActivityLogPanel
        logs={logs}
        onClear={clearLogs}
        showTrigger={false}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />

      {/* Mais: ações que no desktop ficam nos ícones do header */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader className="text-left">
            <SheetTitle>Mais</SheetTitle>
            <SheetDescription>
              {user?.name ? `Conectado como ${user.name}` : 'Ajustes da conta'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 flex flex-col gap-1 pb-[env(safe-area-inset-bottom)]">
            <Button
              variant="ghost"
              className="h-12 justify-start gap-3"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            </Button>

            <Button
              variant="ghost"
              className="h-12 justify-start gap-3"
              onClick={toggleNotifications}
              disabled={permission === 'denied'}
            >
              {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
              {permission === 'denied'
                ? 'Notificações bloqueadas no navegador'
                : notificationsEnabled
                  ? 'Desativar notificações'
                  : 'Ativar notificações'}
            </Button>

            {user?.role === 'admin' && (
              <Button
                variant="ghost"
                className="h-12 justify-start gap-3"
                onClick={() => {
                  setMoreOpen(false);
                  setUsersOpen(true);
                }}
              >
                <Users className="h-5 w-5" />
                Gerenciar usuários
              </Button>
            )}

            <Button
              variant="ghost"
              className="h-12 justify-start gap-3 text-destructive hover:text-destructive"
              onClick={logout}
            >
              <LogOut className="h-5 w-5" />
              Sair
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {user?.role === 'admin' && (
        <UserManagementDialog
          open={usersOpen}
          onOpenChange={setUsersOpen}
          showTrigger={false}
        />
      )}
    </>
  );
}
