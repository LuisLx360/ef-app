// src/components/ProtectedRoute.tsx
import { type ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hook/useAuth'; // ✅ Ruta corregida: hooks (plural)

interface ProtectedRouteProps {
  children: ReactNode;
  requiredNivel?: 'SUPERVISOR' | 'OPERADOR';
  allowedRoles?: string[]; // Roles permitidos (EVALUADOR, SUPERVISOR, etc.)
}

export default function ProtectedRoute({ 
  children, 
  requiredNivel,
  allowedRoles
}: ProtectedRouteProps) {
  const { user, loading, logout, isSupervisor, isOperador, hasRole } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      logout();
    }
  }, [user, loading, logout]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  // ✅ Comprobar acceso
  let hasAccess = true;

  if (requiredNivel) {
    hasAccess = (requiredNivel === 'SUPERVISOR' && isSupervisor()) ||
                (requiredNivel === 'OPERADOR' && isOperador());
  }

  // allowedRoles ahora se combina con OR
  if (allowedRoles && allowedRoles.length > 0) {
    const roleAccess = allowedRoles.some(role => hasRole(role));
    hasAccess = hasAccess || roleAccess; // ✅ OR: si cumple requiredNivel o allowedRoles
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">🔒 Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">
            Tu nivel: <strong>{user.nivel_acceso}</strong>
            {requiredNivel && <> Requiere: <strong>{requiredNivel}</strong></>}
          </p>
          <div className="space-y-3">
            <button onClick={() => window.location.href = '/mis-evaluaciones'} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">→ Ir a Mis Evaluaciones</button>
            <button onClick={() => window.location.href = '/evaluaciones'} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">→ Nueva Evaluación</button>
            <button onClick={logout} className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">→ Cerrar Sesión</button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
