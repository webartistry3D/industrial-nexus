'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { api, setAccessToken, setRefreshToken, clearTokens } from '@/lib/api';

interface User {
  userId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const stored = localStorage.getItem('refreshToken');
    if (token) {
      setAccessToken(token);
      if (stored) setRefreshToken(stored);
      fetchProfile(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const logout = () => {
    clearTokens();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const fetchProfile = async (token: string) => {
    try {
      setAccessToken(token);
      const data = await api.getProfile(5000);
      setUser({ ...data, userId: data.userId ?? data.id });
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);

    const { accessToken, refreshToken, user: userData } = response;
    
    // Check if user has required role (SUPER_ADMIN or OPERATOR)
    if (userData.role !== 'SUPER_ADMIN' && userData.role !== 'OPERATIONS') {
      throw new Error('Access denied. Only administrators can access this application.');
    }

    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    await fetchProfile(accessToken);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
