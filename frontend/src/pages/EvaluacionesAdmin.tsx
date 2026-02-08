// src/pages/EvaluacionesAdmin.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterTabs } from "../components/ui/FilterTabs";
import EvaluationCard from "../components/evaluation/EvaluationCard";
import type { EvaluationApi, EvaluationUI } from "../types/evaluation";
import { mapEvaluation } from "../types/evaluation";
import { apiFetch } from "../lib/api"; // ✅ Import de apiFetch

export default function EvaluacionesAdmin() {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<EvaluationUI[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending-review' | 'in-review' | 'approved' | 'failed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);

        // ✅ USO DE apiFetch
        const data: (EvaluationApi & { nombreEmpleado?: string })[] = await apiFetch("/evaluaciones");

        if (Array.isArray(data)) {
          setEvaluations(
            data.map(api => {
              const ui = mapEvaluation(api);
              return {
                ...ui,
                userName: api.nombreEmpleado || 'Desconocido', // Nombre del evaluador
              };
            })
          );
        } else {
          setEvaluations([]);
        }
      } catch (err) {
        console.error("❌ Error fetch evaluaciones:", err);
        setEvaluations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, []);

  const handleOpenEvaluation = (id: number) => {
    navigate(`/evaluaciones-admin/detalle/${id}`); // Abre detalle de evaluación
  };

  const filteredEvaluations = evaluations.filter((evaluation) => {
    if (filter === "all") return true;
    return evaluation.status === filter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            Evaluaciones
          </h1>
          <p className="text-gray-600">
            Visualiza todas las evaluaciones registradas del personal.
          </p>
        </div>

        {/* Filters */}
        <FilterTabs currentFilter={filter} onFilterChange={setFilter} />

        {/* Evaluations List */}
        {loading ? (
          <div className="text-gray-500 text-center py-12">Cargando evaluaciones…</div>
        ) : filteredEvaluations.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvaluations.map((evaluation) => (
              <div key={evaluation.id} className="relative">
                {/* Tarjeta de evaluación */}
                <EvaluationCard
                  evaluation={evaluation}
                  onClick={() => handleOpenEvaluation(evaluation.id)}
                />

               
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="max-w-sm mx-auto">
              <h3 className="text-gray-900 mb-2 text-lg font-bold">
                No hay evaluaciones disponibles
              </h3>
              <p className="text-gray-500 text-sm">
                Aún no se han registrado evaluaciones o el filtro las ha ocultado.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



