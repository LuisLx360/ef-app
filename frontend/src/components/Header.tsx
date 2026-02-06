// Header.tsx - ✅ isActive PRECISO SIN CAMBIAR ESTILOS
import { useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, Menu } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../hook/useAuth'; // ✅ hooks plural

interface HeaderProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

export default function Header({ isMenuOpen, setIsMenuOpen }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { user, isSupervisor, isAuthenticated, logout } = useAuth();
  const closeMenu = () => setIsMenuOpen(false);

  // ✅ isActive PRECISO: compara path EXACTO o hijos específicos
  const isActive = (path: string): boolean => {
    const currentPath = location.pathname;
    
    // Ruta exacta
    if (currentPath === path) return true;
    
    // Hijos específicos (solo para rutas con /detalle)
    if (path === '/evaluaciones-admin' && currentPath.startsWith('/evaluaciones-admin/detalle')) {
      return true;
    }
    
    return false;
  };

  const showAdminLink = isSupervisor();
  const handleLogout = () => logout();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* 🔹 COLUMNA 1: LOGO */}
          <div className="flex-shrink-0">
  <div className="flex items-center p-2 -m-2 rounded-lg">
    <img
      src="/assets/images/inbev_logo.jpg"
      alt="AB InBev Logo"
      className="h-6 w-auto object-contain hover:scale-105 transition-transform"
    />
  </div>
</div>

          {/* 🔹 COLUMNA 2: NAVEGACIÓN - CENTRO */}
          <div className="hidden md:flex flex-1 justify-center px-8 mx-8">
            <nav className="flex items-center gap-8">
              {/* ✅ Nueva Evaluación - SOLO /evaluaciones */}
              <button
                onClick={() => navigate('/evaluaciones')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive('/evaluaciones') 
                    ? 'text-blue-600 bg-blue-50 border border-blue-200 shadow-sm' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Nueva Evaluación
              </button>

              {/* ✅ Mis evaluaciones - SOLO /mis-evaluaciones */}
              <button
                onClick={() => navigate('/mis-evaluaciones')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive('/mis-evaluaciones') 
                    ? 'text-blue-600 bg-blue-50 border border-blue-200 shadow-sm' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Mis evaluaciones
              </button>

              {/* ✅ Admin - SOLO /evaluaciones-admin y /detalle */}
              {showAdminLink && (
                <button
                  onClick={() => navigate('/evaluaciones-admin')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive('/evaluaciones-admin') 
                      ? 'text-blue-600 bg-blue-50 border border-blue-200 shadow-sm' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Evaluaciones Admin
                </button>
              )}
            </nav>
          </div>

          {/* 🔹 COLUMNA 3: USER + LOGOUT */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {isAuthenticated ? (
              <>
                <div className="hidden md:flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-full border">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900 max-w-[140px] truncate block">
                      {user?.nombre || 'Usuario'}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleLogout}
                  size="sm"
                  variant="ghost"
                  className="gap-2 h-10 px-4 border border-gray-200 hover:border-red-400 hover:bg-red-50 hover:text-red-700 shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Salir</span>
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                size="sm"
                className="gap-2 h-10 px-4 border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 shadow-sm"
              >
                Iniciar sesión
              </Button>
            )}

            <button
              className="md:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all shadow-sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menú"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - MISMA LÓGICA */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-2xl">
          <div className="max-w-6xl mx-auto px-4 py-6 space-y-2">
            <button
              onClick={() => {
                navigate('/evaluaciones');
                closeMenu();
              }}
              className={`w-full text-left p-4 rounded-xl transition-all shadow-sm ${
                isActive('/evaluaciones') 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Nueva Evaluación
            </button>
            
            <button
              onClick={() => {
                navigate('/mis-evaluaciones');
                closeMenu();
              }}
              className={`w-full text-left p-4 rounded-xl transition-all shadow-sm ${
                isActive('/mis-evaluaciones') 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Mis evaluaciones
            </button>
            
            {showAdminLink && (
              <button
                onClick={() => {
                  navigate('/evaluaciones-admin');
                  closeMenu();
                }}
                className={`w-full text-left p-4 rounded-xl transition-all shadow-sm ${
                  isActive('/evaluaciones-admin') 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Evaluaciones Admin
              </button>
            )}
            
            {isAuthenticated && (
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full gap-2 mt-4 shadow-lg"
              >
                <LogOut className="w-5 h-5" />
                Cerrar sesión
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
