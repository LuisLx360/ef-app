// src/pages/MisEvaluaciones.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilterTabs } from '../components/ui/FilterTabs';
import EvaluationCard from '../components/evaluation/EvaluationCard';
import type { EvaluationApi, EvaluationUI } from '../../src/types/evaluation';
import { mapEvaluation } from '../../src/types/evaluation';
import { apiFetch } from '../lib/api'; // ✅ Import de apiFetch

interface User {
  id_empleado: string;
  nombre: string;
  nivel_acceso: string;
  area: string;
}

export default function MisEvaluaciones() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User>({
    id_empleado: '',
    nombre: '',
    nivel_acceso: '',
    area: '',
  });

  const [evaluations, setEvaluations] = useState<EvaluationUI[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending-review' | 'in-review' | 'approved' | 'failed'>('all');
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // Obtener user desde localStorage
  // -----------------------------
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser({
        id_empleado: userData.id_empleado,
        nombre: userData.nombre,
        nivel_acceso: userData.nivel_acceso,
        area: userData.area,
      });
    }
  }, []);

  // -----------------------------
  // Traer evaluaciones del empleado
  // -----------------------------
  useEffect(() => {
    if (!user.id_empleado) return;

    const fetchEvaluations = async () => {
      try {
        setLoading(true);

        // ✅ USO DE apiFetch
        const data: EvaluationApi[] = await apiFetch(`/evaluaciones/empleado/${user.id_empleado}`);

        if (Array.isArray(data)) {
          setEvaluations(data.map(mapEvaluation));
        } else {
          console.warn('API no devolvió un array', data);
          setEvaluations([]);
        }
      } catch (err) {
        console.error('❌ Error fetch evaluaciones:', err);
        setEvaluations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, [user.id_empleado]);

  // -----------------------------
  // Abrir detalle
  // -----------------------------
  const handleOpenEvaluation = (id: number) => {
    navigate(`/evaluaciones/${id}`);
  };

  // -----------------------------
  // Filtrado de evaluaciones
  // -----------------------------
  const filteredEvaluations = evaluations.filter((evaluation) => {
    if (filter === 'all') return true;
    return evaluation.status === filter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            Mis Evaluaciones
          </h1>
          <p className="text-gray-600">
            Revisa el estado de tus evaluaciones completadas
          </p>
        </div>

        {/* Filters */}
        <FilterTabs currentFilter={filter} onFilterChange={setFilter} />

        {/* Evaluations List */}
        {loading ? (
          <p className="text-gray-500 text-center py-12">Cargando evaluaciones…</p>
        ) : filteredEvaluations.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredEvaluations.map((evaluation) => (
              <EvaluationCard
                key={evaluation.id}
                evaluation={evaluation}
                onClick={handleOpenEvaluation}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-gray-900 mb-1">No hay evaluaciones</h3>
              <p className="text-gray-500 text-sm">
                No se encontraron evaluaciones con el filtro seleccionado
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}