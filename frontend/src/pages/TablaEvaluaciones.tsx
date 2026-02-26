import React from 'react';
import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../lib/api";

// --- Interfaces ---
interface MatrizEvaluacionPreguntaDto {
  id: number;
  texto: string;
  orden: number;
}

interface MatrizEvaluacionOperadorDto {
  idEvaluacion: number;
  idEmpleado: number;
  nombre: string;
  resultadoInicial: number;
  resultadoFinal: number;
  respuestas: Record<number, boolean>;
}

interface MatrizEvaluacionDto {
  guiaId: number;
  guiaNombre: string;
  procesoId: number;
  procesoNombre: string;
  preguntas: MatrizEvaluacionPreguntaDto[];
  operadores: MatrizEvaluacionOperadorDto[];
}

interface GuiaOption {
  id: number;
  nombre: string;
  area?: string;
}

interface ProcesoOption {
  id: number;
  nombre: string;
}

export default function EvaluacionesTable() {
  const [matriz, setMatriz] = useState<MatrizEvaluacionDto | null>(null);
  const [guias, setGuias] = useState<GuiaOption[]>([]);
  const [procesos, setProcesos] = useState<ProcesoOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false); // 👈 NUEVO: Estado para la descarga del Excel
  
  const [idGuia, setIdGuia] = useState<number | null>(null);
  const [idProceso, setIdProceso] = useState<number | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});

  // --- Lógica de Detección ---
  const guiaSeleccionada = useMemo(() => guias.find(g => g.id === idGuia), [idGuia, guias]);
  
  const esElectrica = useMemo(() => {
    if (!guiaSeleccionada) return false;
    return guiaSeleccionada.area === 'ELECTRICO' || 
           guiaSeleccionada.nombre.toLowerCase().includes('electrico');
  }, [guiaSeleccionada]);

  const seleccionCompleta = esElectrica ? !!idGuia : (!!idGuia && !!idProceso);

  // 1. Cargar Guías al inicio
  useEffect(() => {
    const loadGuias = async () => {
      try {
        const data = await apiFetch("/categorias/evaluacion");
        setGuias(data.map((c: any) => ({
          id: c.id_categoria,
          nombre: c.nombre,
          area: c.area
        })));
      } catch (err) {
        console.error("Error guías:", err);
      }
    };
    loadGuias();
  }, []);

  // 2. Cargar Procesos si no es eléctrica
  useEffect(() => {
    if (!idGuia || esElectrica) {
      setProcesos([]);
      setIdProceso(null);
      return;
    }

    const loadProcesos = async () => {
      try {
        const data = await apiFetch(`/categorias/${idGuia}/procesos/evaluacion`);
        setProcesos(data.map((p: any) => ({ id: p.id_proceso, nombre: p.nombre })));
      } catch (err) {
        console.error("Error procesos:", err);
      }
    };
    loadProcesos();
  }, [idGuia, esElectrica]);

  // 3. Cargar Matriz cuando la selección esté lista
  useEffect(() => {
    if (!seleccionCompleta) {
      setMatriz(null);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const procesoParam = esElectrica ? 0 : idProceso;
        const data = await apiFetch(`/evaluaciones/matriz?idCategoria=${idGuia}&idProceso=${procesoParam}`);
        setMatriz(data);
      } catch (err) {
        console.error("Error matriz:", err);
        setMatriz(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [idGuia, idProceso, seleccionCompleta, esElectrica]);

  // --- Helpers ---
  const toggleQuestion = (id: number) => {
    setExpandedQuestions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getQuestionPerc = (id: number) => {
    if (!matriz) return 0;
    const total = matriz.operadores.length;
    const ok = matriz.operadores.filter(op => !!op.respuestas[id]).length;
    return total > 0 ? Math.round((ok / total) * 100) : 0;
  };

  // 👈 NUEVO: Función para descargar el Excel
 // --- Función Corregida ---
  const handleExportExcel = async () => {
    if (!idGuia) return;
    
    try {
      setIsExporting(true);

      // 1. Obtener el token del localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        alert("❌ Sesión expirada o no válida");
        return;
      }

      // 2. Usar la base de la API de tus variables de entorno (Vite)
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const procesoParam = esElectrica ? 0 : idProceso;
      
      // 3. Construir la URL con los parámetros
      const url = `${API_BASE}/evaluaciones/exportar-matriz?idCategoria=${idGuia}&idProceso=${procesoParam}`;
      
      // 4. Realizar la petición incluyendo el Header de Authorization
      const res = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}` 
        },
      });
      
      if (res.status === 401) {
        alert("❌ No tienes permisos o tu sesión expiró");
        return;
      }

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

      // 5. Procesar la descarga del Blob
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      
      // Generar nombre de archivo limpio
      const nombreGuia = guiaSeleccionada?.nombre.replace(/[^a-zA-Z0-9]/g, '_') || 'Matriz';
      const fecha = new Date().toISOString().split('T')[0];
      link.download = `Matriz_${nombreGuia}_${fecha}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error: any) {
      console.error("❌ Error exportando excel:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 w-full overflow-x-hidden">
      
      {/* HEADER & FILTROS */}
      <div className="p-4 md:p-8 w-full max-w-[1600px] mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Panel de Evaluaciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            {esElectrica ? "⚡ Guía Eléctrica (Proceso no requerido)" : "Seleccione los parámetros para ver resultados"}
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col flex-1 max-w-sm">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Guía Técnica</label>
            <select
              value={idGuia ?? ""}
              onChange={(e) => {
                setIdGuia(Number(e.target.value) || null);
                setIdProceso(null);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            >
              <option value="">Seleccionar Guía...</option>
              {guias.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>

          {!esElectrica && idGuia && (
            <div className="flex flex-col flex-1 max-w-sm animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Proceso</label>
              <select
                value={idProceso ?? ""}
                onChange={(e) => setIdProceso(Number(e.target.value) || null)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              >
                <option value="">Seleccionar Proceso...</option>
                {procesos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* CONTENEDOR DE TABLA (Tamaño de página base) */}
      <div className="flex-1 flex flex-col px-4 md:px-8 pb-8 max-w-[1600px] mx-auto w-full">
        <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden min-h-[60vh] flex flex-col">
          
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-gray-400 font-medium animate-pulse">Consultando base de datos...</span>
            </div>
          ) : matriz ? (
            <div className="overflow-auto flex-1 relative">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="sticky left-0 z-40 bg-gray-100 p-4 text-xs font-bold text-gray-600 uppercase tracking-wider border-r w-48 md:w-64">
                      Operador
                    </th>
                    {matriz.preguntas.map((q, i) => {
                      const isExpanded = expandedQuestions[q.id];
                      return (
                        <th 
                          key={q.id} 
                          onClick={() => toggleQuestion(q.id)}
                          className="p-4 text-xs font-semibold text-gray-600 border-r min-w-[200px] max-w-[300px] align-top cursor-pointer hover:bg-gray-200 transition-colors relative group"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-blue-600 font-bold">Q{i + 1}</span>
                            <p className={`text-[13px] leading-snug text-gray-800 ${isExpanded ? "" : "line-clamp-2"}`}>
                              {q.texto}
                            </p>
                            {q.texto.length > 50 && (
                              <span className="text-[10px] text-blue-500 font-bold mt-1 group-hover:underline">
                                {isExpanded ? "← Ver menos" : "Ver más →"}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                    <th className="p-4 text-center text-xs font-bold text-gray-600 uppercase w-24">Inicial</th>
                    <th className="p-4 text-center text-xs font-bold text-gray-600 uppercase w-24 border-l">Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {matriz.operadores.map((op, idx) => (
                    <tr key={op.idEvaluacion} className="hover:bg-blue-50/30 transition-colors">
                      <td className="sticky left-0 z-30 bg-white font-semibold text-gray-800 p-4 border-r shadow-[4px_0_10px_-5px_rgba(0,0,0,0.1)] text-sm">
                        {op.nombre}
                      </td>
                      {matriz.preguntas.map(q => (
                        <td key={q.id} className="p-4 text-center border-r">
                          <input 
                            type="checkbox" 
                            checked={!!op.respuestas[q.id]} 
                            readOnly 
                            className="h-5 w-5 accent-blue-600 rounded cursor-default"
                          />
                        </td>
                      ))}
                      <td className="p-4 text-center">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold border border-blue-100">
                          {op.resultadoInicial}%
                        </span>
                      </td>
                      <td className="p-4 text-center border-l">
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold border border-green-100">
                          {op.resultadoFinal}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Footer de totales */}
                <tfoot className="sticky bottom-0 z-30 bg-gray-50 border-t-2 border-gray-300">
                  <tr className="divide-x divide-gray-200">
                    <td className="sticky left-0 bg-gray-50 p-4 font-bold text-gray-700 text-xs uppercase">Promedio Grupal</td>
                    {matriz.preguntas.map(q => {
                      const perc = getQuestionPerc(q.id);
                      return (
                        <td key={q.id} className="p-4 text-center">
                          <span className={`text-sm font-bold ${perc < 70 ? "text-red-500" : "text-green-600"}`}>
                            {perc}%
                          </span>
                        </td>
                      );
                    })}
                    <td colSpan={2} className="bg-gray-100"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 p-10">
              <div className="bg-gray-50 p-6 rounded-full mb-4">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-400">Esperando selección para generar matriz</p>
              <p className="text-sm">Selecciona una guía técnica para comenzar</p>
            </div>
          )}
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex justify-end mt-6 gap-3">
           {/* 👈 NUEVO: Reemplazado window.print() por handleExportExcel con estado de carga */}
           {matriz && (
             <button 
               className={`w-full md:w-auto text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                 isExporting ? "bg-gray-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
               }`}
               onClick={handleExportExcel}
               disabled={isExporting}
             >
               {isExporting ? (
                 <>
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   Descargando...
                 </>
               ) : (
                 <>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                   </svg>
                   Exportar Excel
                 </>
               )}
             </button>
           )}
        </div>
      </div>
    </div>
  );
}