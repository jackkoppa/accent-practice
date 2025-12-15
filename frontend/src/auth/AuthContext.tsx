import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from './authService';
import { isAuthConfigured } from './config';

interface User {
  email: string;
  sub: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: () => Promise<void>;
  logout: () => void;
  getAccessToken: () => string | null;
  authConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const authConfigured = isAuthConfigured();

  useEffect(() => {
    const initAuth = async () => {
      // Check for OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('code')) {
        const success = await authService.handleCallback();
        if (success) {
          setIsAuthenticated(true);
          setUser(authService.getCurrentUser());
        }
      } else {
        // Check existing auth state
        const authenticated = authService.isAuthenticated();
        setIsAuthenticated(authenticated);
        if (authenticated) {
          setUser(authService.getCurrentUser());
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async () => {
    await authService.login();
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const getAccessToken = () => {
    return authService.getAccessToken();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        getAccessToken,
        authConfigured,
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

