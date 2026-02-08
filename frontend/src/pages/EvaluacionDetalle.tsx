import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import { ProcessSection } from "../components/evaluation/ProcessSection";
import { CheckCircle2 } from "lucide-react";
import { apiFetch } from "../lib/api"; // ✅ Import del helper

// ✅ INTERFACES ACTUALIZADAS
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
}

interface EvaluacionDetalle {
  idEvaluacion: number;
  categoriaNombre: string;
  procesoNombre?: string;
  observaciones: string;
  empleadoNombre: string;
  fechaEvaluacion: string;
  estado: string;
  respuestas: {
    idPregunta: number;
    respuesta: boolean;
    noAplica: boolean;  // ✅ NUEVO
    titulo: string;
  }[];
}

export default function EvaluationDetalle() {
  const { id } = useParams<{ id: string }>();
  const [evaluation, setEvaluation] = useState<EvaluacionDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchEvaluation = async () => {
      try {
        setLoading(true);

        // ✅ USO DE apiFetch
        const raw: EvaluacionDetalleRaw = await apiFetch(`/evaluaciones/${id}`);

        console.log("RAW evaluación backend:", raw);

        // ✅ NORMALIZACIÓN CON noAplica
        const normalized: EvaluacionDetalle = {
          idEvaluacion: raw.idEvaluacion,
          categoriaNombre: raw.categoria,
          procesoNombre: raw.area === "packaging" ? raw.proceso || undefined : undefined,
          observaciones: raw.observaciones || "",
          empleadoNombre: raw.evaluador,
          fechaEvaluacion: raw.fechaEvaluacion,
          estado: raw.estado || "pendiente",
          respuestas: raw.respuestas.map((r) => ({
            idPregunta: r.idPregunta,
            respuesta: r.respuesta,
            noAplica: r.no_aplica || false,  // ✅ NUEVO
            titulo: r.titulo,
          })),
        };

        console.log("✅ Evaluación normalizada:", normalized);
        setEvaluation(normalized);
      } catch (err: any) {
        console.error("❌ Error fetch evaluación:", err);
        setEvaluation(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [id]);


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
  const applicableQuestions = evaluation.respuestas.filter((r) => !r.noAplica);
  const completedCount = applicableQuestions.filter((r) => r.respuesta).length;
  const totalCount = applicableQuestions.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const noAplicaCount = evaluation.respuestas.filter((r) => r.noAplica).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header - ACTUALIZADO */}
        <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex-shrink-0 shadow-lg">
                <CheckCircle2 className="size-10 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                  Detalle de Evaluación #{evaluation.idEvaluacion}
                </h1>
                <div className="flex flex-wrap gap-4 text-lg">
                  <span className="font-semibold text-gray-900 bg-gray-100 px-4 py-2 rounded-full">
                    👤 {evaluation.empleadoNombre}
                  </span>
                  <span className="text-gray-600 bg-blue-50 px-4 py-2 rounded-full">
                    📅 {new Date(evaluation.fechaEvaluacion).toLocaleDateString()}
                  </span>
                  <span className="text-green-600 bg-green-50 px-4 py-2 rounded-full font-medium">
                    📊 {completedCount}/{totalCount} ({progress.toFixed(1)}%)
                  </span>
                  {noAplicaCount > 0 && (
                    <span className="text-gray-600 bg-gray-100 px-4 py-2 rounded-full font-medium">
                      ⏭️ {noAplicaCount} No Aplica
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guía Técnica SIN CAMBIOS */}
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

        {/* Proceso solo si es packaging SIN CAMBIOS */}
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

        {/* Progreso - ACTUALIZADO */}
        <Card className="mb-8 shadow-lg border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <Label className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                📊
                <span>Progreso de la Evaluación</span>
              </Label>
              <span className="text-3xl font-bold text-gray-700">
                {completedCount}/{totalCount}
              </span>
            </div>
            <Progress 
              value={progress} 
              className="h-4 [&>div]:!bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-blue-600" 
            />
            <div className="mt-4 text-sm text-gray-600 flex flex-wrap gap-4">
              <span>{completedCount} de {totalCount} preguntas aplicables ({progress.toFixed(1)}%)</span>
              {noAplicaCount > 0 && (
                <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-xs">
                  {noAplicaCount} preguntas excluidas (No Aplica)
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preguntas - ACTUALIZADO CON noAplica */}
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
              questions={evaluation.respuestas.map((r) => ({
                id_pregunta: r.idPregunta,
                titulo: r.titulo,
                peso: 1.0,  // Default para vista
                respuesta: r.respuesta,
                noAplica: r.noAplica,  // ✅ NUEVO
              }))}
              onToggleQuestion={() => {}}  // Empty para readOnly
              onNoAplicaToggle={() => {}}  // ✅ NUEVO - Empty para readOnly
              readOnly  // ✅ readOnly prop
            />
          </CardContent>
        </Card>

        {/* Observaciones SIN CAMBIOS */}
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
      </div>
    </div>
  );
}
