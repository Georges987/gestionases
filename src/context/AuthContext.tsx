import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Utilisateur } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: Utilisateur | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyToken();
  }, []);

  async function verifyToken() {
    try {
      const res = await fetch(`${API_BASE}/auth.php?action=verify`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch {
      // Non connecté
    }
    setLoading(false);
  }

  async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth.php?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Impossible de contacter le serveur' };
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!user,
      user,
      token,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
