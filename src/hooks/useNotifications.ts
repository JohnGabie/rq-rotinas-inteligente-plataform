import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';

type NotificationPermission = 'default' | 'granted' | 'denied';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
}

export function useNotifications() {
  const [enabled, setEnabled] = useLocalStorage<boolean>('smart-office-notifications', false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      setEnabled(true);
      return true;
    }
    return false;
  }, [setEnabled]);

  const sendNotification = useCallback(({ title, body, icon }: NotificationOptions) => {
    if (!enabled || permission !== 'granted') return;

    try {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
      });
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  }, [enabled, permission]);

  const toggleNotifications = useCallback(() => {
    if (!enabled && permission !== 'granted') {
      requestPermission();
    } else {
      setEnabled(!enabled);
    }
  }, [enabled, permission, requestPermission, setEnabled]);

  return {
    enabled,
    permission,
    requestPermission,
    sendNotification,
    toggleNotifications,
  };
}
