'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { auth } from './api';

interface User {
  id: string;
  email: string | null;
  phone: string;
  role: string;
  profile?: {
    name: string;
    avatarUrl: string | null;
    bio: string | null;
    isVerified: boolean;
    ratingAvg: number;
    ratingCount: number;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Schedule token refresh before it expires (refresh at 12 min, token lasts 15 min)
  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const result = await auth.refresh();
        setToken(result.token);
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
        scheduleRefresh();
      } catch {
        // Refresh failed — token expired, clear state
        setToken(null);
        setUser(null);
        localStorage.removeItem('user');
      }
    }, 12 * 60 * 1000); // 12 minutes
  }, []);

  useEffect(() => {
    // On mount: try to restore session from httpOnly cookie via refresh endpoint
    const savedUser = localStorage.getItem('user');

    async function tryRefresh() {
      try {
        const result = await auth.refresh();
        setToken(result.token);
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
        scheduleRefresh();
      } catch {
        // No valid refresh cookie — check for legacy localStorage token
        const legacyToken = localStorage.getItem('token');
        if (legacyToken && savedUser) {
          try {
            setToken(legacyToken);
            setUser(JSON.parse(savedUser));
          } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      }
      setLoading(false);
    }

    tryRefresh();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleRefresh]);

  const login = useCallback((newToken: string, newUser: User) => {
    // Still store token in localStorage for backward compat + user data for UX
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    scheduleRefresh();
  }, [scheduleRefresh]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    // Clear httpOnly cookie on server
    auth.logout().catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
