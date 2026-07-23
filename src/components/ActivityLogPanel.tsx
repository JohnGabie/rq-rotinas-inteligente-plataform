import { History } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActivityLog } from '@/types/activity';
import { ActivityLogList } from './ActivityLogList';

interface ActivityLogPanelProps {
  logs: ActivityLog[];
  /** Dispensa as notificações da vista (não apaga o histórico no servidor). */
  onClear: () => void;
}

/**
 * Painel lateral de atividades — usado apenas no desktop, a partir do header.
 * No mobile o histórico é uma seção própria (aba), não um painel sobreposto.
 */
export function ActivityLogPanel({ logs, onClear }: ActivityLogPanelProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9 relative"
          aria-label="Ver histórico de atividades"
        >
          <History className="h-4 w-4 sm:h-5 sm:w-5" />
          {logs.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
              {logs.length > 99 ? '99+' : logs.length}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Atividades
          </SheetTitle>
          <SheetDescription>
            Últimas {logs.length} atividades registradas
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="mt-4 h-[calc(100vh-160px)] pr-4">
          <ActivityLogList logs={logs} onClear={onClear} />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
