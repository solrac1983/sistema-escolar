import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { User } from '../types';

interface AuthContextData {
    signed: boolean;
    user: User | null;
    loading: boolean;
    signIn: (token: string, user: User) => void;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storagedUser = localStorage.getItem('user');
        const storagedToken = localStorage.getItem('token');

        if (storagedUser && storagedToken) {
            // Check token validity?
            try {
                const decoded: any = jwtDecode(storagedToken);
                if (decoded.exp * 1000 < Date.now()) {
                    signOut();
                } else {
                    setUser(JSON.parse(storagedUser));
                    api.defaults.headers.common['Authorization'] = `Bearer ${storagedToken}`;
                }
            } catch (err) {
                signOut();
            }
        }
        setLoading(false);
    }, []);

    const signIn = (token: string, user: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);
    };

    const signOut = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
