import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api';
import { jwtDecode } from "jwt-decode";

interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    tenant_id: string;
    company_id?: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string) => Promise<User | null>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // 1. Synchronously initialize user from cached storage to prevent flicker or premature redirect
    const [user, setUser] = useState<User | null>(() => {
        const cached = localStorage.getItem('user');
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch (e) {
                // ignore
            }
        }
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                return {
                    id: decoded.sub,
                    email: decoded.sub,
                    full_name: decoded.role === 'admin' ? 'Administrator' : 'User',
                    role: decoded.role || 'user',
                    tenant_id: decoded.tid || '',
                    company_id: decoded.cid || '',
                };
            } catch (e) {
                // ignore
            }
        }
        return null;
    });

    const [isLoading, setIsLoading] = useState<boolean>(() => {
        // If we already have token and user, not loading initially
        return !localStorage.getItem('token');
    });

    const lastRefreshRef = useRef<number>(Date.now());

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    }, []);

    const silentRefresh = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await api.post<{ access_token: string }>('/auth/refresh');
            if (res.data?.access_token) {
                localStorage.setItem('token', res.data.access_token);
                lastRefreshRef.current = Date.now();
            }
        } catch (e) {
            console.warn("Silent session keepalive skipped or failed:", e);
        }
    }, []);

    // Initial auth verification on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.get('/users/me')
                .then(res => {
                    setUser(res.data);
                    localStorage.setItem('user', JSON.stringify(res.data));
                })
                .catch(err => {
                    // Only log out if backend explicitly rejected with 401 Unauthorized
                    if (err.response?.status === 401) {
                        logout();
                    } else {
                        console.warn("Could not reach backend to verify user, retaining cached session:", err);
                    }
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [logout]);

    // Proactive background keep-alive: periodic timer + tab visibility + user activity
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Periodic keepalive every 15 minutes (token lives 30 days, but keepalive guarantees freshness)
        const intervalId = setInterval(() => {
            if (localStorage.getItem('token')) {
                silentRefresh();
            }
        }, 15 * 60 * 1000);

        // Wakeup refresh when tab becomes visible after inactivity or sleep
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && localStorage.getItem('token')) {
                const elapsed = Date.now() - lastRefreshRef.current;
                // If more than 10 minutes passed since last refresh, renew token immediately
                if (elapsed > 10 * 60 * 1000) {
                    silentRefresh();
                }
            }
        };

        // Activity listener with 10-minute throttle
        const handleUserActivity = () => {
            const elapsed = Date.now() - lastRefreshRef.current;
            if (elapsed > 10 * 60 * 1000 && localStorage.getItem('token')) {
                lastRefreshRef.current = Date.now();
                silentRefresh();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('mousemove', handleUserActivity, { passive: true });
        window.addEventListener('keydown', handleUserActivity, { passive: true });
        window.addEventListener('click', handleUserActivity, { passive: true });

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('mousemove', handleUserActivity);
            window.removeEventListener('keydown', handleUserActivity);
            window.removeEventListener('click', handleUserActivity);
        };
    }, [silentRefresh, user]);

    const login = async (token: string): Promise<User | null> => {
        localStorage.setItem('token', token);
        let optimisticUser: User | null = null;
        try {
            const decoded: any = jwtDecode(token);
            optimisticUser = {
                id: decoded.sub,
                email: decoded.sub,
                full_name: decoded.role === 'admin' ? 'Administrator' : 'User',
                role: decoded.role || 'user',
                tenant_id: decoded.tid || '',
                company_id: decoded.cid || '',
            };
            setUser(optimisticUser);
            localStorage.setItem('user', JSON.stringify(optimisticUser));
        } catch (e) {
            console.error("Failed to decode token", e);
        }

        try {
            const res = await api.get('/users/me');
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
            return res.data;
        } catch (e) {
            console.warn("Using token profile fallback", e);
            return optimisticUser;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

