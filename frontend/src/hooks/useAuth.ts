import { useState, useCallback, useEffect } from 'react';
import { mockLogin } from '@/lib/api/mockResponses';
import { AuthUser, LoginResponse, User } from '@/lib/api/types';
import { API_ENDPOINTS } from '@/lib/api/config';
import { apiClient } from '@/lib/api/client';
import { USE_MOCK_API } from '@/lib/api/mode';

interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: number;
}

const STORAGE_KEY = 'rotina-inteligente-session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Convert API User to AuthUser
const userToAuthUser = (user: User): AuthUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
});

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthSession;
        // Check if session is expired
        if (parsed.expiresAt > Date.now()) {
          return parsed;
        }
        // Session expired, remove it
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return null;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check session expiration periodically
  useEffect(() => {
    if (!session) return;

    const checkExpiration = () => {
      if (session.expiresAt <= Date.now()) {
        logout();
      }
    };

    const interval = setInterval(checkExpiration, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [session]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      let response: LoginResponse | null = null;

      if (USE_MOCK_API) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        response = mockLogin(email, password);
      } else {
        // Real API call
        const result = await apiClient.post<LoginResponse>(
          API_ENDPOINTS.AUTH_LOGIN,
          { email, password },
          false
        );
        if (result.success && result.data) {
          response = result.data;
        } else {
          setError(result.error || 'Erro ao fazer login');
          setIsLoading(false);
          return false;
        }
      }

      if (!response) {
        setError('Email ou senha inválidos');
        setIsLoading(false);
        return false;
      }

      const newSession: AuthSession = {
        token: response.access_token,
        user: userToAuthUser(response.user),
        expiresAt: Date.now() + (response.expires_in * 1000),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      setSession(newSession);
      setIsLoading(false);
      return true;
    } catch {
      setError('Erro ao conectar com o servidor');
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      if (!USE_MOCK_API) {
        // Call logout endpoint
        await apiClient.post(API_ENDPOINTS.AUTH_LOGOUT);
      }
    } catch {
      // Ignore logout errors
    }

    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setIsLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isAuthenticated: !!session,
    user: session?.user || null,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };
}
