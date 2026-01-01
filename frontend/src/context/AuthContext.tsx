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
    login: (token: string) => void;
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
                jwtDecode(token);
                // In a real app, fetch full user profile from /users/me
                // Here we just use the token payload if available or mock it
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

    const login = (token: string) => {
        localStorage.setItem('token', token);
        jwtDecode(token);
        // Optimistic update or fetch user
        api.get('/users/me').then(res => setUser(res.data));
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
