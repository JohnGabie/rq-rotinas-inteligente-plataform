import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { USE_MOCK_API } from '@/lib/api/mode';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConnectionStatusProps {
  isLoading?: boolean;
  isError?: boolean;
}

export function ConnectionStatus({ isLoading, isError }: ConnectionStatusProps) {
  if (USE_MOCK_API) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Mock
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Usando dados locais (modo desenvolvimento)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isLoading) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              Conectando
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Conectando ao servidor...</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isError) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="gap-1 text-xs">
              <WifiOff className="h-3 w-3" />
              Offline
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Erro de conexão com o servidor</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1 text-xs text-green-600 border-green-600">
            <Wifi className="h-3 w-3" />
            Online
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Conectado ao servidor</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
