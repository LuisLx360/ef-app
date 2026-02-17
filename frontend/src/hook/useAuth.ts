// src/hooks/useAuth.ts - ✅ CON hasRole y tu backend
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id_empleado: string;
  nombre: string;
  nivel_acceso: 'OPERADOR' | 'SUPERVISOR' | 'EVALUADOR';
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

  // Nueva lógica de roles
  const isSupervisor = () => user?.nivel_acceso === 'SUPERVISOR';
  const isEvaluador = () => user?.nivel_acceso === 'EVALUADOR';
  const isOperador = () => user?.nivel_acceso === 'OPERADOR';

  // Función general para permisos: si quieres restringir a X roles
  const hasRole = (...roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.nivel_acceso);
  };

  // Permisos para cada tipo de acceso en la app
  const canViewAdminFeatures = () => isEvaluador(); // Evaluador = admin
  const canViewTeam = () => isSupervisor() || isEvaluador(); // Ambos pueden ver su equipo

  return {
    user,
    loading,
    login,
    logout,
    hasRole,
    isSupervisor,
    isEvaluador,
    isOperador,
    canViewAdminFeatures,
    canViewTeam,
    isAuthenticated: !!user,
    nivel_acceso: user?.nivel_acceso,
  };
}

