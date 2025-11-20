'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const savedAuth = localStorage.getItem('isAuthenticated');
    const savedUsername = localStorage.getItem('username');
    
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      setUsername(savedUsername || 'Guest');
    }
  }, []);

  const login = (inputUsername: string, password: string): boolean => {
    // Validate password is exactly 4 digits
    if (!/^\d{4}$/.test(password)) {
      return false;
    }

    const finalUsername = inputUsername.trim() || 'Guest';
    setIsAuthenticated(true);
    setUsername(finalUsername);
    
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('username', finalUsername);
    
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsername('');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
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