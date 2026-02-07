// src/components/evaluation/Evaluation.tsx - CÓDIGO COMPLETO CON "No Aplica"
import { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { SelectRadix } from "../ui/select-radix";
import { ProcessSection } from "./ProcessSection";
import type { Question } from "./ProcessSection";
import { CheckCircle2, Zap, Package } from "lucide-react";

interface Categoria {
  id_categoria: number;
  nombre: string;
  area: string;
  procesos: Proceso[];
}

interface Proceso {
  id_proceso: number;
  nombre: string;
}

interface User {
  id_empleado: string;
  nombre: string;
  nivel_acceso: string;
  area: string;
}

interface Option {
  value: string;
  label: string;
}

export default function Evaluation() {
  const [guides, setGuides] = useState<Categoria[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<number>(0);
  const [selectedProcessId, setSelectedProcessId] = useState<number>(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [observations, setObservations] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User>({ 
    id_empleado: "", 
    nombre: "", 
    nivel_acceso: "", 
    area: "" 
  });

  const token = localStorage.getItem("token");

  // loadGuides SIN CAMBIOS
  const loadGuides = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return setLoading(false);

    setLoading(true);
    
    try {
      console.log('🔍 Evaluación → /categorias/evaluacion');
      
      const categoriasResp = await fetch("http://localhost:3000/categorias/evaluacion", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!categoriasResp.ok) throw new Error('No categorías');

      const categorias: Categoria[] = await categoriasResp.json();
      
      const guidesWithProcesses = await Promise.all(
        categorias.map(async (cat) => {
          const procesosResp = await fetch(
           `http://localhost:3000/categorias/${cat.id_categoria}/procesos/evaluacion`,
           { headers: { Authorization: `Bearer ${token}` } }
          );
          const procesos: Proceso[] = procesosResp.ok ? await procesosResp.json() : [];
          
          return { 
            ...cat, 
            procesos,
            area: cat.nombre.toLowerCase().includes('electrico') ? 'electrico' : 'packaging'
          };
        })
      );

      console.log(`✅ ${guidesWithProcesses.length} guías evaluacion`);
      setGuides(guidesWithProcesses);
      setSelectedGuideId(0);
      setSelectedProcessId(0);

    } catch (error) {
      console.error('❌ Error:', error);
      setLoading(false);
    }
  }, []);

  const currentGuide = guides.find((g) => g.id_categoria === selectedGuideId);
  const isElectrica = currentGuide?.area === 'electrico';
  const currentProcess = isElectrica 
    ? null 
    : guides.find((g) => g.id_categoria === selectedGuideId)?.procesos?.find((p) => p.id_proceso === selectedProcessId);

  const guidesOptions: Option[] = guides.map((guide) => ({
    value: guide.id_categoria.toString(),
    label: `${guide.nombre} ${guide.area === 'electrico' ? '⚡' : '📦'}`,
  }));

  const procesosOptions: Option[] = !isElectrica && currentGuide
    ? currentGuide.procesos.map((process) => ({
        value: process.id_proceso.toString(),
        label: process.nombre,
      }))
    : [];

  // useEffects SIN CAMBIOS
  useEffect(() => {
    if (token) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser({
          id_empleado: userData.id_empleado || userData.id || "",
          nombre: userData.nombre || userData.empleado || "",
          nivel_acceso: userData.nivel_acceso || "",
          area: userData.area || ""
        });
      }
      loadGuides();
    }
  }, [token, loadGuides]);

  useEffect(() => {
    if (selectedGuideId > 0 && token) {
      if (isElectrica) {
        loadQuestionsDirecto();
      } else if (selectedProcessId > 0) {
        loadQuestions();
      } else {
        setQuestions([]);
      }
    } else {
      setQuestions([]);
    }
  }, [selectedGuideId, selectedProcessId, token, isElectrica]);

  // loadQuestions CON noAplica ✅
  const loadQuestionsDirecto = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/categorias/${selectedGuideId}/preguntas`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const preguntasData: any[] = await response.json();
        setQuestions(
          preguntasData.map((q) => ({
            id_pregunta: q.id_pregunta,
            titulo: q.titulo,
            peso: parseFloat(q.peso),
            respuesta: false,
            noAplica: false,  // ✅ NUEVO
          }))
        );
      }
    } catch (error) {
      console.error("❌ Error preguntas eléctricas:", error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/categorias/${selectedGuideId}/procesos/${selectedProcessId}/preguntas`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const preguntasData: any[] = await response.json();
        setQuestions(
          preguntasData.map((q) => ({
            id_pregunta: q.id_pregunta,
            titulo: q.titulo,
            peso: parseFloat(q.peso),
            respuesta: false,
            noAplica: false,  // ✅ NUEVO
          }))
        );
      }
    } catch (error) {
      console.error("❌ Error preguntas packaging:", error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGuideChange = (guideId: string) => {
    const id = parseInt(guideId);
    if (!isNaN(id) && id > 0) {
      setSelectedGuideId(id);
      setSelectedProcessId(0);
      setQuestions([]);
    }
  };

  // ✅ NUEVO HANDLER No Aplica
  const handleNoAplicaToggle = useCallback((questionId: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id_pregunta === questionId 
          ? { ...q, noAplica: !q.noAplica, respuesta: false }  // Reset respuesta
          : q
      )
    );
  }, []);

  const handleProcessChange = (processId: string) => {
    const id = parseInt(processId);
    if (!isNaN(id) && id > 0) {
      setSelectedProcessId(id);
    }
  };

  const handleToggleQuestion = useCallback((questionId: number) => {
    console.log('🎯 Toggle ejecutado:', questionId);
    setQuestions((prev) =>
      prev.map((q) =>
        q.id_pregunta === questionId ? { ...q, respuesta: !q.respuesta } : q
      )
    );
  }, []);

  // handleSubmit CON noAplica ✅
  const handleSubmit = useCallback(async () => {
    if (questions.length === 0 || selectedGuideId === 0) {
      alert('⚠️ Selecciona una guía y responde las preguntas');
      return;
    }
    if (!token) {
      alert('❌ Sesión expirada');
      return;
    }
    if (!user.id_empleado) {
      alert('❌ ID empleado no encontrado');
      return;
    }

    setLoading(true);
    try {
      const evaluacionData = {
        idEmpleado: user.id_empleado,
        idCategoria: selectedGuideId,
        evaluador: "Autoevaluación",
        observaciones: observations.trim() || "Sin observaciones - Autoevaluación completada",
        respuestas: questions.map((q) => ({
          idPregunta: q.id_pregunta,
          respuesta: q.respuesta,
          noAplica: q.noAplica,  // ✅ NUEVO
        })),
      };

      const response = await fetch("http://localhost:3000/evaluaciones", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(evaluacionData),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const resultado = await response.json();
      setSubmitted(true);
      alert(`✅ ¡Evaluación #${resultado.idEvaluacion} enviada!`);
      
      setTimeout(() => {
        setSubmitted(false);
        setObservations("");
        setQuestions([]);
        setSelectedGuideId(0);
        setSelectedProcessId(0);
      }, 2000);
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [questions, selectedGuideId, token, user.id_empleado, observations]);

  // 🔥 CÁLCULO FILTRADO "No Aplica" - ANTES DEL RETURN
  const applicableQuestions = questions.filter((q) => !q.noAplica);
  const completedCount = applicableQuestions.filter((q) => q.respuesta).length;
  const totalCount = applicableQuestions.length || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header SIN CAMBIOS */}
        <Card className="mb-8 shadow-lg border-0">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl flex-shrink-0">
                <CheckCircle2 className="size-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Autoevaluación de Empleado</h1>
                <p className="text-lg text-gray-600">
                  {user.nombre || "Empleado"} - {user.nivel_acceso || "N/A"} - {user.area || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guía Técnica SIN CAMBIOS */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="p-6">
            <Label className="text-base font-semibold text-gray-900 mb-4 block">
              📋 Guía Técnica
            </Label>
            <SelectRadix
              value={selectedGuideId.toString()}
              onValueChange={handleGuideChange}
              placeholder="Selecciona una guía técnica..."
              options={guidesOptions}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Proceso - SOLO para packaging SIN CAMBIOS */}
        {!isElectrica && selectedGuideId > 0 && procesosOptions.length > 0 && (
          <Card className="mb-8 shadow-sm">
            <CardContent className="p-6">
              <Label className="text-lg font-semibold text-gray-900 mb-4 block">
                <Package className="inline w-5 h-5 mr-2" />
                Proceso
              </Label>
              <SelectRadix
                value={selectedProcessId.toString()}
                onValueChange={handleProcessChange}
                placeholder="Selecciona un proceso..."
                options={procesosOptions}
                className="w-full"
              />
            </CardContent>
          </Card>
        )}

        {/* Mensaje para guías eléctricas - CORREGIDO totalCount */}
        {isElectrica && selectedGuideId > 0 && !questions.length && (
          <Card className="mb-8 shadow-sm border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-blue-800">
                <Zap className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold">⚡ Evaluación Eléctrica Directa</h3>
                  <p className="text-sm mt-1">
                    Cargando preguntas de la guía {currentGuide?.nombre}...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Placeholder si falta selección SIN CAMBIOS */}
        {selectedGuideId === 0 && (
          <Card className="mb-8 shadow-sm border-2 border-dashed border-gray-200">
            <CardContent className="p-8 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecciona tu guía</h3>
              <p className="text-gray-500">Elige una guía técnica para comenzar la evaluación</p>
            </CardContent>
          </Card>
        )}

        {/* Progreso SIN CAMBIOS - YA USA completedCount/totalCount filtrados */}
        {questions.length > 0 && (
          <Card className="mb-8 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold text-gray-900">
                  📊 Progreso {isElectrica ? '(Eléctrica)' : '(Packaging)'} 
                  <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {questions.filter(q => q.noAplica).length} No Aplica
                  </span>
                </Label>
                <span className="text-sm font-medium text-gray-700">
                  {completedCount}/{totalCount}
                </span>
              </div>
              <Progress value={(completedCount / totalCount) * 100} className="h-3" />
            </CardContent>
          </Card>
        )}

        {/* ProcessSection CON onNoAplicaToggle ✅ */}
        {questions.length > 0 && (
          <ProcessSection
            title={isElectrica ? currentGuide?.nombre || "Evaluación" : currentProcess?.nombre || "Proceso"}
            questions={questions}
            onToggleQuestion={handleToggleQuestion}
            onNoAplicaToggle={handleNoAplicaToggle}  // ✅ NUEVO
          />
        )}

        {/* Observaciones SIN CAMBIOS */}
        <Card className="mb-8 shadow-sm">
          <CardContent className="p-6 md:p-8">
            <Label className="text-lg font-semibold text-gray-900 mb-4 block">💬 Observaciones</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Comentarios adicionales sobre la evaluación (opcional)..."
              className="min-h-[120px]"
              disabled={questions.length === 0}
            />
          </CardContent>
        </Card>

        {/* Submit - MEJORADO */}
        <div className="flex justify-end">
          {submitted ? (
            <div className="flex items-center gap-3 bg-green-50 border-2 border-green-200 text-green-800 px-8 py-4 rounded-xl font-semibold shadow-lg animate-pulse">
              <CheckCircle2 className="size-6" />
              ¡Evaluación enviada exitosamente!
            </div>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || questions.length === 0 || selectedGuideId === 0}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-10 py-4 rounded-xl text-lg font-semibold shadow-lg h-14 min-w-[220px] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" />
                  Enviando...
                </>
              ) : (
                `📤 Enviar ${isElectrica ? 'Evaluación Eléctrica' : 'Evaluación'} (${completedCount}/${totalCount})`
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
