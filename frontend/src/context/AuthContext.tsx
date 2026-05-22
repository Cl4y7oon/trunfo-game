import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserOut } from '../api/client';

interface AuthContextType {
  user: UserOut | null;
  token: string | null;
  login: (user: UserOut, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('trunfo_token');
    const savedUser = localStorage.getItem('trunfo_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (userData: UserOut, authToken: string) => {
    localStorage.setItem('trunfo_token', authToken);
    localStorage.setItem('trunfo_user', JSON.stringify(userData));
    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    localStorage.removeItem('trunfo_token');
    localStorage.removeItem('trunfo_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}