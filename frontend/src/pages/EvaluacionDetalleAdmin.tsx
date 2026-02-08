// src/pages/EvaluacionDetalleAdmin.tsx - ADAPTADO "No Aplica" con apiFetch
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import { Button } from "../components/ui/button";
import { Loader2, Download, Trash2, CheckCheck, CheckCircle2 } from "lucide-react";
import { ProcessSection } from "../components/evaluation/ProcessSection";
import { Dialog, DialogFooter, useDialog } from "../components/ui/dialog";
import { apiFetch } from "../lib/api"; // ✅ Import del helper

/* =======================
   TIPOS - ACTUALIZADOS
======================== */
interface EvaluacionDetalleRaw {
  idEvaluacion: number;
  idEmpleado: string;
  idCategoria: number;
  fechaEvaluacion: string;
  evaluador: string;
  observaciones: string;
  estado: string;

  porcentaje_original: number;
  porcentaje_actual: number;

  respuestas: {
    idRespuesta: number;
    idEvaluacion: number;
    idPregunta: number;
    respuesta: boolean;
    no_aplica: boolean;  // ✅ NUEVO
    comentarios: string | null;
    titulo: string;
  }[];

  proceso?: string | null;
  categoria: string;
  area: "electrico" | "packaging";
  empleadoNombre?: string;
}

interface RespuestaEditable {
  idPregunta: number;
  respuesta: boolean;
  noAplica: boolean;  // ✅ NUEVO
  titulo: string;
  idRespuesta?: number;
}

interface EvaluacionDetalleAdmin {
  idEvaluacion: number;
  categoriaNombre: string;
  procesoNombre?: string;
  observaciones: string;
  empleadoNombre: string;
  evaluadorNombre: string;
  fechaEvaluacion: string;
  estado: string;

  porcentajeOriginal: number;
  porcentajeFinal: number;

  respuestas: RespuestaEditable[];
}

/* =======================
   COMPONENTE
======================== */
export default function EvaluacionDetalleAdmin() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [evaluation, setEvaluation] = useState<EvaluacionDetalleAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [respuestasEdit, setRespuestasEdit] = useState<RespuestaEditable[]>([]);
  const [estadoEdit, setEstadoEdit] = useState<string>("");

  const deleteDialog = useDialog();

  /* =======================
     FETCH EVALUACIÓN - ACTUALIZADO
  ========================== */
  const fetchEvaluation = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);

      // ✅ USO DE apiFetch
      const raw: EvaluacionDetalleRaw = await apiFetch(`/evaluaciones/${id}`);

      // ✅ NORMALIZACIÓN CON noAplica
      const normalized: EvaluacionDetalleAdmin = {
        idEvaluacion: raw.idEvaluacion,
        categoriaNombre: raw.categoria,
        procesoNombre: raw.area === "packaging" ? raw.proceso || undefined : undefined,
        observaciones: raw.observaciones || "",
        empleadoNombre: raw.empleadoNombre || "Sin nombre",
        evaluadorNombre: raw.evaluador || "Sin evaluador",
        fechaEvaluacion: raw.fechaEvaluacion,
        estado: raw.estado || "pendiente",
        porcentajeOriginal: raw.porcentaje_original,
        porcentajeFinal: raw.porcentaje_actual,
        respuestas: raw.respuestas.map((r) => ({
          idPregunta: r.idPregunta,
          idRespuesta: r.idRespuesta,
          respuesta: r.respuesta,
          noAplica: r.no_aplica || false, // ✅ NUEVO
          titulo: r.titulo,
        })),
      };

      setEvaluation(normalized);
      setRespuestasEdit(normalized.respuestas);
      setEstadoEdit(normalized.estado);
    } catch (err) {
      console.error("❌ Error fetch evaluación:", err);
      setEvaluation(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvaluation();
  }, [fetchEvaluation]);

  // 🔹 Toggle pregunta - SIN CAMBIOS
  const handleToggleQuestion = useCallback((questionId: number) => {
    setRespuestasEdit((prev) =>
      prev.map((r) =>
        r.idPregunta === questionId ? { ...r, respuesta: !r.respuesta } : r
      )
    );
  }, []);

  // ✅ NUEVO: Toggle No Aplica para admin
  const handleNoAplicaToggle = useCallback((questionId: number) => {
    setRespuestasEdit((prev) =>
      prev.map((r) =>
        r.idPregunta === questionId 
          ? { ...r, noAplica: !r.noAplica, respuesta: false } // Reset respuesta
          : r
      )
    );
  }, []);

  // 🔹 Guardar cambios - ACTUALIZADO
  const handleSaveChanges = async () => {
    if (!evaluation || !id) return;

    // Detectar cambios en respuestas y noAplica
    const cambiosRespuestas = respuestasEdit.filter((r) =>
      evaluation.respuestas.some(
        (orig) =>
          orig.idPregunta === r.idPregunta &&
          (orig.respuesta !== r.respuesta || orig.noAplica !== r.noAplica)
      )
    );

    const cambioEstado = estadoEdit !== evaluation.estado;

    if (cambiosRespuestas.length === 0 && !cambioEstado) return;

    try {
      setSaving(true);

      // 1️⃣ Actualizar estado si cambió
      if (cambioEstado) {
        await apiFetch(`/evaluaciones/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ estado: estadoEdit }),
        });
      }

      // 2️⃣ Actualizar respuestas CON noAplica
      if (cambiosRespuestas.length > 0) {
        await apiFetch(`/evaluaciones/${id}/respuestas`, {
          method: "PATCH",
          body: JSON.stringify({
            respuestas: cambiosRespuestas.map((r) => ({
              idPregunta: r.idPregunta,
              respuesta: r.respuesta,
              noAplica: r.noAplica, // ✅ NUEVO
            })),
          }),
        });
      }

      // 3️⃣ Refrescar datos
      await fetchEvaluation();
    } catch (err) {
      console.error("❌ Error guardando cambios:", err);
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Resto de funciones SIN CAMBIOS
  const handleDeleteEvaluation = async () => {
    if (!evaluation || !id) return;

    try {
      setDeleting(true);
      deleteDialog.close();

      await apiFetch(`/evaluaciones/${id}`, { method: "DELETE" });

      navigate("/evaluaciones-admin");
    } catch (err) {
      console.error("❌ Error eliminando:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
  if (!id || !evaluation) {
    alert("Faltan datos para descargar");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("❌ Sesión expirada");
      return;
    }

    // ✅ Usar variable de entorno para apuntar al backend en Railway
    const API_BASE = import.meta.env.VITE_API_URL;

    // fetch nativo para descargar Excel
    const res = await fetch(`${API_BASE}/evaluaciones/exportar/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 404) {
      alert("❌ Evaluación no encontrada");
      return;
    }
    if (!res.ok) throw new Error(`Error ${res.status}`);

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;

    const nombreEvaluado = evaluation.empleadoNombre.replace(/[^a-zA-Z0-9\s]/g, "_");
    const nombreEvaluador = evaluation.evaluadorNombre.replace(/[^a-zA-Z0-9\s]/g, "_");
    const nombreGuia = evaluation.categoriaNombre.replace(/[^a-zA-Z0-9\s]/g, "_");
    const fecha = new Date(evaluation.fechaEvaluacion).toISOString().split("T")[0];

    a.download = `${nombreEvaluado}_evaluado_por_${nombreEvaluador}_${nombreGuia}_${fecha}.xlsx`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

  } catch (err: any) {
    console.error("❌ Error descargando Excel:", err);
    alert(`Error: ${err.message}`);
  }
};





  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        Cargando evaluación…
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="text-center py-12 text-red-500">
        <div className="text-6xl mb-4">😞</div>
        <h2 className="text-2xl font-bold mb-2">Evaluación no encontrada</h2>
        <p>La evaluación que buscas no existe o no tienes permisos para verla.</p>
      </div>
    );
  }

  // 🔥 CÁLCULO ACTUALIZADO con "No Aplica"
  const applicableQuestions = respuestasEdit.filter((r) => !r.noAplica);
  const completedCount = applicableQuestions.filter((r) => r.respuesta).length;
  const totalCount = applicableQuestions.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const noAplicaCount = respuestasEdit.filter((r) => r.noAplica).length;

  const hasChanges =
    estadoEdit !== evaluation.estado ||
    respuestasEdit.some((edit) =>
      evaluation.respuestas.some(
        (orig) => 
          orig.idPregunta === edit.idPregunta && 
          (orig.respuesta !== edit.respuesta || orig.noAplica !== edit.noAplica)
      )
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* HEADER - ACTUALIZADO */}
        <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex-shrink-0 shadow-lg">
                <CheckCircle2 className="size-10 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                      Detalle de Evaluación 
                    </h1>
                    <div className="flex flex-wrap gap-4 text-lg">
                      <span className="font-semibold text-gray-900 bg-gray-100 px-4 py-2 rounded-full">
                        Evaluado: {evaluation.empleadoNombre}
                      </span>
                      <span className="font-semibold text-gray-900 bg-gray-100 px-4 py-2 rounded-full">
                        Evaluador: {evaluation.evaluadorNombre}
                      </span>
                      <span className="text-gray-600 bg-blue-50 px-4 py-2 rounded-full">
                        📅 {new Date(evaluation.fechaEvaluacion).toLocaleDateString()}
                      </span>
                      <span className={`px-4 py-2 rounded-full font-medium text-lg ${
                        completedCount === totalCount 
                          ? 'text-green-600 bg-green-50' 
                          : 'text-yellow-600 bg-yellow-50'
                      }`}>
                        📊 {completedCount}/{totalCount} ({progress.toFixed(0)}%)
                      </span>
                      {noAplicaCount > 0 && (
                        <span className="text-gray-600 bg-gray-100 px-4 py-2 rounded-full font-medium">
                          ⏭️ {noAplicaCount} No Aplica
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-4">
                      <span className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-semibold">
                        👤 Autoevaluación: {evaluation.porcentajeOriginal.toFixed(1)}%
                      </span>
                      <span className="px-4 py-2 rounded-full bg-green-50 text-green-700 font-semibold">
                        🧑‍🏫 Resultado final: {evaluation.porcentajeFinal.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button 
                      onClick={handleSaveChanges} 
                      disabled={saving || !hasChanges}
                      variant={hasChanges ? "default" : "outline"}
                      className="gap-2"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCheck className="w-4 h-4" />
                      )}
                      Guardar cambios
                    </Button>
                    
                    <Button 
                        variant="outline" 
                        className="gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
                        onClick={handleDownload} 
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </Button>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <Label className="font-bold text-lg min-w-[80px]">Estado:</Label>
                    <select
                      value={estadoEdit}
                      onChange={(e) => setEstadoEdit(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm min-w-[140px]"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_revision">En revisión</option>
                      <option value="aprobada">Aprobada</option>
                      <option value="reprobada">Reprobada</option>
                    </select>
                  </div>
                  
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={deleteDialog.open}
                    disabled={deleting}
                    className="gap-2"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GUIA TÉCNICA SIN CAMBIOS */}
        <Card className="shadow-sm hover:shadow-md transition-shadow mb-6">
          <CardContent className="p-6">
            <Label className="text-xl font-bold text-gray-900 mb-4 block flex items-center gap-2">
              📋 Guía Técnica
            </Label>
            <div className="text-2xl font-semibold text-gray-900">
              {evaluation.categoriaNombre}
            </div>
          </CardContent>
        </Card>

        {/* PROCESO SIN CAMBIOS */}
        {evaluation.procesoNombre && (
          <Card className="shadow-sm hover:shadow-md transition-shadow mb-6">
            <CardContent className="p-6">
              <Label className="text-xl font-bold text-gray-900 mb-4 block flex items-center gap-2">
                🏭 Proceso
              </Label>
              <div className="text-lg text-gray-700">{evaluation.procesoNombre}</div>
            </CardContent>
          </Card>
        )}

        {/* PROGRESO - ACTUALIZADO */}
        <Card className="mb-8 shadow-lg border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <Label className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                📊 <span>Progreso de la Evaluación</span>
              </Label>
              <span className="text-3xl font-bold text-gray-700">
                {completedCount}/{totalCount}
              </span>
            </div>
            <Progress 
              value={progress} 
              className="h-4 [&>div]:!bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-blue-600" 
            />
            <div className="mt-4 text-sm text-gray-600 flex flex-wrap gap-4 items-center">
              <span>{completedCount} de {totalCount} preguntas aplicables ({progress.toFixed(1)}%)</span>
              {noAplicaCount > 0 && (
                <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">
                  {noAplicaCount} No Aplica
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PREGUNTAS INTERACTIVAS - ACTUALIZADO */}
        <Card className="shadow-lg border-0 mb-8">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <Label className="text-2xl font-bold text-gray-900">
                {evaluation.procesoNombre || evaluation.categoriaNombre}
              </Label>
              <span className="text-sm text-gray-500">
                {evaluation.respuestas.length} preguntas totales
              </span>
            </div>
            
            <ProcessSection
              title={evaluation.procesoNombre || evaluation.categoriaNombre}
              questions={respuestasEdit.map((r) => ({
                id_pregunta: r.idPregunta,
                titulo: r.titulo,
                peso: 1.0,
                respuesta: r.respuesta,
                noAplica: r.noAplica,  // ✅ NUEVO
              }))}
              onToggleQuestion={handleToggleQuestion}
              onNoAplicaToggle={handleNoAplicaToggle}  // ✅ NUEVO
              readOnly={false}
            />
          </CardContent>
        </Card>

        {/* OBSERVACIONES SIN CAMBIOS */}
        <Card className="shadow-sm">
          <CardContent className="p-8">
            <Label className="text-2xl font-bold text-gray-900 mb-6 block flex items-center gap-3">
              💬 Observaciones
            </Label>
            <Textarea
              value={evaluation.observaciones}
              readOnly
              className="min-h-[150px] resize-none bg-gray-50 border-2 border-dashed border-gray-200 focus:border-blue-300"
              placeholder="Sin observaciones"
            />
          </CardContent>
        </Card>

        {/* DIALOG ELIMINAR SIN CAMBIOS */}
        <Dialog 
          isOpen={deleteDialog.isOpen} 
          onClose={deleteDialog.close} 
          title="Confirmar eliminación"
        >
          <div className="text-gray-700 mb-6">
            <p>¿Estás seguro? Se eliminará permanentemente la evaluación #{
              evaluation.idEvaluacion
            } de <strong>{evaluation.empleadoNombre}</strong>.</p>
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mt-4 border-l-4 border-red-400">
              Esta acción no se puede deshacer.
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={deleteDialog.close}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteEvaluation}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                'Eliminar evaluación'
              )}
            </Button>
          </DialogFooter>
        </Dialog>
      </div>
    </div>
  );
}

