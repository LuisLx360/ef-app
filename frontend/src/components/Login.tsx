import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hook/useAuth'; // ✅ IMPORT CORRECTO

export default function Login() {
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ✅ useAuth AQUÍ (body del componente) - NO en handler
  const { login } = useAuth();

  // Base URL desde la variable de entorno
  const API_BASE = import.meta.env.VITE_API_URL;

  const handleIdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value.trim().toUpperCase();
    setEmployeeId(id);
    setError('');

    if (id.length >= 8) {
      try {
        setLoading(true);
        console.log('🚀 INICIANDO FETCH →', id);

        const response = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_empleado: id }),
          credentials: 'include', // ✅ permite cookies/session
        });

        console.log('📡 STATUS:', response.status, 'OK:', response.ok);

        if (response.ok) {
          const data = await response.json();
          /* console.log('✅ DATA:', data); */

          // ✅ login DEL HOOK (definido arriba)
          login(data.access_token, data.empleado);
          setEmployeeName(data.empleado.nombre);
          console.log('✅ Login EXITOSO:', data.empleado.nombre);

        } else {
          const errorText = await response.text();
          console.log('❌ ERROR:', response.status, errorText);
          setEmployeeName('');
          localStorage.clear();
          setError(`Error ${response.status}: ${errorText}`);
        }
      } catch (err: any) {
        console.error('💥 CATCH:', err.message);
        setEmployeeName('');
        localStorage.clear();
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    } else {
      setEmployeeName('');
    }
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (employeeId && employeeName && !loading) {
      const token = localStorage.getItem('token');
      if (token) {
        navigate('/evaluaciones');
      } else {
        setError('Error de autenticación');
      }
    } else {
      setError('Ingresa un ID de empleado válido');
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Login</h1>
            <p className="text-gray-600">Portal de Autoevaluación Empleados</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
                ID Empleado
              </label>
              <input
                type="text"
                id="employeeId"
                value={employeeId}
                onChange={handleIdChange}
                placeholder="Ej: 94103448"
                maxLength={10}
                className={`w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {loading && (
                <div className="mt-1 flex items-center text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Buscando...
                </div>
              )}
            </div>

            <div>
              <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                type="text"
                id="employeeName"
                value={employeeName}
                readOnly
                placeholder="Tu nombre aparecerá aquí"
                className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed"
              />
              <p className="mt-2 text-sm text-gray-500">
                Ingresa tu ID para ver tu nombre y rol
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!employeeId || !employeeName || loading}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:hover:bg-blue-600"
            >
              {loading ? 'Cargando...' : 'Iniciar evaluación →'}
            </button>
          </form>
        </div>
      </div>

      <div className="hidden lg:block lg:w-3/5 relative">
        <img
          src="assets/images/pepsi.jpg"
          //No colocarle 1 al nombre pepsi si no caera toda la base de datos
          alt="Trabajo en equipo industrial"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-transparent"></div>
      </div>
    </div>
  );
}
