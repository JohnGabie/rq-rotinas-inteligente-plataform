import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User, AuthTokens, AuthState, LoginCredentials } from '@/types';
import { authApi, getStoredTokens, storeTokens, clearTokens, checkInactivity } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_CHECK_INTERVAL = 60000; // Check every minute

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const isAuthenticated = !!user && !!tokens;

  // Check stored tokens on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedTokens = getStoredTokens();
      
      if (storedTokens) {
        setTokens(storedTokens);
        
        try {
          const response = await authApi.getMe();
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            clearTokens();
            setTokens(null);
          }
        } catch {
          clearTokens();
          setTokens(null);
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Inactivity check
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      if (checkInactivity()) {
        logout();
        toast({
          variant: 'destructive',
          title: 'Sessão expirada',
          description: 'Você foi desconectado por inatividade.',
        });
      }
    }, INACTIVITY_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await authApi.login(
        credentials.email,
        credentials.password,
        credentials.recaptchaToken
      );
      
      if (response.success && response.data) {
        const { user: userData, tokens: tokenData } = response.data;
        
        setUser(userData);
        setTokens(tokenData);
        storeTokens(tokenData);
        
        toast({
          title: 'Login realizado',
          description: `Bem-vindo, ${userData.name || userData.email}!`,
        });
        
        return true;
      }
      
      throw new Error(response.error || 'Erro ao fazer login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      
      toast({
        variant: 'destructive',
        title: 'Erro de autenticação',
        description: message,
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors on logout
    } finally {
      setUser(null);
      setTokens(null);
      clearTokens();
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    if (!tokens) return;
    
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch {
      // Ignore refresh errors
    }
  }, [tokens]);

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
