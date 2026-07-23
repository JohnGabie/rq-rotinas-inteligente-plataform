import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getWsUrl } from '@/lib/api/config';

type WebSocketEvent = {
  event: string;
  data: Record<string, unknown>;
};

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

const RECONNECT_BASE_DELAY = 3000; // 3 segundos (delay inicial)
const RECONNECT_MAX_DELAY = 60000; // teto de 60 segundos entre tentativas

/**
 * Hook para conexão WebSocket em tempo real.
 *
 * Automaticamente invalida queries do React Query quando recebe eventos
 * do servidor, mantendo a UI sincronizada entre múltiplos clientes.
 *
 * Eventos suportados:
 * - device_toggled, device_created, device_updated, device_deleted
 * - routine_toggled, routine_created, routine_updated, routine_deleted, routine_executed
 */
export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  // Evita que múltiplos gatilhos (timer, evento 'online', visibilitychange)
  // criem conexões concorrentes que se acumulam e travam a CPU.
  const isConnecting = useRef(false);
  // Fechamento intencional (unmount / disconnect) — impede reconexão automática.
  const intentionalClose = useRef(false);
  // Referência estável para connect, usada pelo scheduleReconnect para evitar
  // dependência circular entre os dois callbacks.
  const connectRef = useRef<() => void>(() => {});
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');

  // Agenda uma reconexão com backoff exponencial (3s, 6s, 12s… até 60s).
  // Substitui o antigo delay fixo de 3s que martelava o servidor sem parar.
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeout.current) return; // já há uma reconexão agendada
    const delay = Math.min(
      RECONNECT_BASE_DELAY * 2 ** reconnectAttempts.current,
      RECONNECT_MAX_DELAY
    );
    reconnectAttempts.current += 1;
    console.log(`[WebSocket] Reconexão agendada em ${delay}ms`);
    reconnectTimeout.current = setTimeout(() => {
      reconnectTimeout.current = null;
      connectRef.current();
    }, delay);
  }, []);

  const connect = useCallback(() => {
    // Limpar timeout de reconexão anterior
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    // Não criar um socket novo se já existe um conectado ou em processo de
    // conexão. Sem esta guarda, sockets órfãos se acumulam e cada um dispara
    // seu próprio loop de reconexão (tempestade de conexões = 100% de CPU).
    if (
      isConnecting.current ||
      ws.current?.readyState === WebSocket.OPEN ||
      ws.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    intentionalClose.current = false;
    isConnecting.current = true;
    setStatus('connecting');

    // Obter token de autenticação
    const session = localStorage.getItem('rotina-inteligente-session');
    const token = session ? JSON.parse(session).token : null;

    // Não conectar sem token - servidor requer autenticação
    if (!token) {
      isConnecting.current = false;
      setStatus('disconnected');
      return;
    }

    // Construir URL com token
    const baseUrl = getWsUrl();
    const url = `${baseUrl}?token=${token}`;

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        isConnecting.current = false;
        reconnectAttempts.current = 0; // reset do backoff ao conectar com sucesso
        setStatus('connected');
        console.log('[WebSocket] Conectado');
      };

      ws.current.onmessage = (event) => {
        try {
          // Responder a heartbeat do servidor
          if (event.data === 'ping') {
            ws.current?.send('pong');
            return;
          }

          const message: WebSocketEvent = JSON.parse(event.data);
          console.log('[WebSocket] Evento recebido:', message.event, message.data);

          // Processar eventos
          switch (message.event) {
            case 'device_toggled':
              // Atualizar cache diretamente para resposta instantânea
              if (message.data.device_id && typeof message.data.is_on === 'boolean') {
                queryClient.setQueryData(['devices'], (oldDevices: unknown) => {
                  if (!Array.isArray(oldDevices)) return oldDevices;
                  return oldDevices.map((device: { id: string; isOn: boolean }) =>
                    device.id === message.data.device_id
                      ? { ...device, isOn: message.data.is_on }
                      : device
                  );
                });
              }
              break;

            case 'device_created':
            case 'device_updated':
            case 'device_deleted':
              // Para outros eventos de device, invalidar para refetch
              queryClient.invalidateQueries({ queryKey: ['devices'] });
              break;

            case 'routine_toggled':
              // Update direto no cache — não invalidar para evitar race condition com mutation
              if (message.data.routine_id && typeof message.data.is_active === 'boolean') {
                queryClient.setQueryData(['routines'], (oldRoutines: unknown) => {
                  if (!Array.isArray(oldRoutines)) return oldRoutines;
                  return oldRoutines.map((routine: { id: string; isActive: boolean }) =>
                    routine.id === message.data.routine_id
                      ? { ...routine, isActive: message.data.is_active }
                      : routine
                  );
                });
              }
              break;

            case 'routine_created':
            case 'routine_updated':
            case 'routine_deleted':
              queryClient.invalidateQueries({ queryKey: ['routines'] });
              break;

            case 'routine_executed':
              queryClient.invalidateQueries({ queryKey: ['routines'] });
              queryClient.invalidateQueries({ queryKey: ['devices'] });
              break;
          }

          // Invalidar activities para todos os eventos (logs atualizados)
          queryClient.invalidateQueries({ queryKey: ['activities'] });

        } catch (error) {
          console.warn('[WebSocket] Erro ao processar mensagem:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('[WebSocket] Erro:', error);
        setStatus('error');
      };

      ws.current.onclose = (event) => {
        isConnecting.current = false;
        ws.current = null;
        setStatus('disconnected');
        console.log('[WebSocket] Desconectado, código:', event.code);

        // Reconectar automaticamente (exceto em fechamento intencional).
        if (event.code !== 1000 && !intentionalClose.current) {
          scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('[WebSocket] Erro ao criar conexão:', error);
      isConnecting.current = false;
      ws.current = null;
      setStatus('error');
      scheduleReconnect();
    }
  }, [queryClient, scheduleReconnect]);

  // Mantém a referência estável apontando para o connect mais recente.
  connectRef.current = connect;

  const disconnect = useCallback(() => {
    intentionalClose.current = true;
    isConnecting.current = false;
    reconnectAttempts.current = 0;

    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    if (ws.current) {
      ws.current.close(1000, 'Fechamento intencional');
      ws.current = null;
    }

    setStatus('disconnected');
  }, []);

  // Conectar ao montar, desconectar ao desmontar.
  // Deps vazias de propósito: connect/disconnect são estáveis o suficiente e
  // não queremos que o efeito remonte a conexão a cada render.
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconectar quando a rede voltar ou a aba ficar visível.
  // Registrado uma única vez: as guardas dentro de connect() já impedem
  // conexões duplicadas, então não é preciso re-registrar a cada mudança de
  // status (o que antes remontava listeners a todo instante).
  useEffect(() => {
    const handleOnline = () => {
      console.log('[WebSocket] Rede disponível, reconectando...');
      connectRef.current();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        connectRef.current();
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    status,
    isConnected: status === 'connected',
    connect,
    disconnect,
  };
}
