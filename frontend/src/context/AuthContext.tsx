import React, { createContext, useContext, useState, useEffect } from 'react';
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
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                // Immediately set initial user from token while network fetches /users/me
                setUser({
                    id: decoded.sub,
                    email: decoded.sub,
                    full_name: decoded.role === 'admin' ? 'Administrator' : 'User',
                    role: decoded.role || 'user',
                    tenant_id: decoded.tid || '',
                    company_id: decoded.cid || '',
                });
                api.get('/users/me')
                    .then(res => setUser(res.data))
                    .catch(() => logout())
                    .finally(() => setIsLoading(false));
            } catch (e) {
                logout();
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }, []);

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
        } catch (e) {
            console.error("Failed to decode token", e);
        }

        try {
            const res = await api.get('/users/me');
            setUser(res.data);
            return res.data;
        } catch (e) {
            console.warn("Using token profile fallback", e);
            return optimisticUser;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
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
