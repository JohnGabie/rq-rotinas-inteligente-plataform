import { useState, useCallback, useEffect } from 'react';
import { AuthUser, LoginResponse, User } from '@/lib/api/types';
import { API_ENDPOINTS } from '@/lib/api/config';
import { apiClient } from '@/lib/api/client';

// Interface para tipar a resposta envelope do seu Backend
interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    error?: string;
}

interface AuthSession {
    token: string;
    user: AuthUser;
    expiresAt: number;
}

const STORAGE_KEY = 'rotina-inteligente-session';

// Helper: Converte o User da API para o formato da Sessão
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
                if (parsed.expiresAt > Date.now()) {
                    // Restaura o header de autorização ao carregar a página
                    apiClient.setHeader('Authorization', `Bearer ${parsed.token}`);
                    return parsed;
                }
                localStorage.removeItem(STORAGE_KEY);
            } catch {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        return null;
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Monitora a expiração do token
    useEffect(() => {
        if (!session) return;
        const checkExpiration = () => {
            if (session.expiresAt <= Date.now()) logout();
        };
        const interval = setInterval(checkExpiration, 60000);
        return () => clearInterval(interval);
    }, [session]);

    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Chamada Real ao Endpoint
            // O Backend espera JSON {email, password}, não FormData.
            const response = await apiClient.post<ApiResponse<LoginResponse>>(
                API_ENDPOINTS.AUTH_LOGIN,
                { email, password }
            );

            // 2. Validação da Resposta
            // O token está dentro de response.data (devido ao envelope ApiResponse)
            if (response.success && response.data) {
                const { access_token, user, expires_in } = response.data;

                const newSession: AuthSession = {
                    token: access_token,
                    user: userToAuthUser(user),
                    expiresAt: Date.now() + (expires_in * 1000), // Converte segundos para ms
                };

                // 3. Persistência e Configuração do Header
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
                apiClient.setHeader('Authorization', `Bearer ${access_token}`);

                setSession(newSession);
                setIsLoading(false);
                return true;

            } else {
                // Erro retornado pela API (ex: 401 ou 422 tratado)
                setError(response.message || 'Email ou senha inválidos');
                setIsLoading(false);
                return false;
            }

        } catch (err) {
            console.error(err);
            setError('Erro de conexão com o servidor.');
            setIsLoading(false);
            return false;
        }
    }, []);

    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
            // Tenta notificar o backend, mas limpa localmente independente do sucesso
            await apiClient.post(API_ENDPOINTS.AUTH_LOGOUT);
        } catch (e) {
            // Ignora erro de logout (token expirado, server off, etc)
        } finally {
            localStorage.removeItem(STORAGE_KEY);
            apiClient.setHeader('Authorization', ''); // Remove o token do header
            setSession(null);
            setIsLoading(false);
        }
    }, []);

    const clearError = useCallback(() => setError(null), []);

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