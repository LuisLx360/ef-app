// src/pages/EvaluacionesAdmin.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterTabs } from "../components/ui/FilterTabs";
import EvaluationCard from "../components/evaluation/EvaluationCard";
import type { EvaluationApi, EvaluationUI } from "../types/evaluation";
import { mapEvaluation } from "../types/evaluation";
import { apiFetch } from "../lib/api";

export default function EvaluacionesAdmin() {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<EvaluationUI[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending-review' | 'in-review' | 'approved' | 'failed'>('all');
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false); // ✅ Nuevo estado

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        const data: (EvaluationApi & { nombreEmpleado?: string })[] = await apiFetch("/evaluaciones");

        if (Array.isArray(data)) {
          setEvaluations(
            data.map(api => {
              const ui = mapEvaluation(api);
              return {
                ...ui,
                userName: api.nombreEmpleado || 'Desconocido',
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
    navigate(`/evaluaciones-admin/detalle/${id}`);
  };

  // ✅ NUEVA FUNCIÓN: Exportar resumen Excel
  const handleExportResumen = async () => {
    try {
      setExportLoading(true);
      
      // Obtener token del localStorage (ajusta según tu auth)
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('❌ Sesión expirada. Por favor, inicia sesión nuevamente.');
        return;
      }

      const response = await fetch('/api/evaluaciones/exportar-resumen', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Importante: NO usar 'Content-Type' para archivos binarios
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      // Crear blob y descargar
      const blob = await response.blob();
      const contentType = response.headers.get('content-type') || '';
      const filename = `Resumen_Evaluaciones_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      // Crear URL temporal y link de descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Excel descargado:', filename);
      
    } catch (error) {
      console.error('❌ Error exportando Excel:', error);
      alert('❌ Error al exportar el resumen. Verifica que tengas permisos de SUPERVISOR/EVALUADOR.');
    } finally {
      setExportLoading(false);
    }
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

        {/* ✅ BOTÓN EXPORTAR - NUEVO */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-2">
            <FilterTabs currentFilter={filter} onFilterChange={setFilter} />
          </div>
          
          <button
            onClick={handleExportResumen}
            disabled={exportLoading}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
              exportLoading
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            {exportLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exportando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10l-5.5 5.5m0 0L12 21l5.5-5.5m-5.5 5.5V6" />
                </svg>
                Exportar Resumen Excel
              </>
            )}
          </button>
        </div>

        {/* Evaluations List */}
        {loading ? (
          <div className="text-gray-500 text-center py-12">Cargando evaluaciones…</div>
        ) : filteredEvaluations.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvaluations.map((evaluation) => (
              <div key={evaluation.id} className="relative">
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


