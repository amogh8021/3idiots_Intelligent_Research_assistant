import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';
import { authService, LoginPayload, RegisterPayload } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  quickDemoLogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('researchdesk_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('researchdesk_token');
      if (storedToken) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const handleAuthSuccess = (res: AuthResponse) => {
    localStorage.setItem('researchdesk_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const login = async (payload: LoginPayload) => {
    const res = await authService.login(payload);
    handleAuthSuccess(res);
  };

  const register = async (payload: RegisterPayload) => {
    const res = await authService.register(payload);
    handleAuthSuccess(res);
  };

  const quickDemoLogin = async () => {
    try {
      // Attempt login with default researcher credentials
      await login({
        email: 'researcher@researchdesk.ai',
        password: 'not-used-in-mvp',
      });
    } catch {
      // Or register demo user if not yet initialized
      await register({
        name: 'Dr. Eleanor Vance',
        email: 'researcher@researchdesk.ai',
        password: 'password123',
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('researchdesk_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        quickDemoLogin,
        logout,
      }}
    >
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
