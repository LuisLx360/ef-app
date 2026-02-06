// src/hooks/useAuth.ts - ✅ CON hasRole y tu backend
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id_empleado: string;
  nombre: string;
  nivel_acceso: 'OPERADOR' | 'SUPERVISOR' | string;
  area: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const verifyToken = useCallback(async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser) as User;
      setUser(parsedUser);
    } catch {
      localStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    navigate('/login', { replace: true });
  };

  // ✅ FUNCIÓN hasRole ADAPTADA A TU BACKEND
  const hasRole = (requiredNivel: string): boolean => {
    return user?.nivel_acceso === requiredNivel;
  };

  const isSupervisor = () => user?.nivel_acceso === 'SUPERVISOR';
  const isOperador = () => user?.nivel_acceso === 'OPERADOR';

  return {
    user,
    loading,
    login,
    logout,
    hasRole,        // ✅ AHORA SÍ EXISTE
    isSupervisor,
    isOperador,
    isAuthenticated: !!user,
    nivel_acceso: user?.nivel_acceso,
  };
}
