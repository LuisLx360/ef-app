import { Injectable } from '@nestjs/common';
import { db } from './index.js';
import { categorias, procesos, preguntas, empleados, evaluaciones, respuestas, historial_evaluaciones } from './schema.js';
import { eq, isNull, and, or, desc, sql } from 'drizzle-orm';

@Injectable()
export class DbService {

  // -----------------------------
  // Categorías y Procesos
  // -----------------------------
  async getProcesosByCategoria(id_categoria: number) {
    return await db
      .select()
      .from(procesos)
      .where(eq(procesos.id_categoria, id_categoria))
      .orderBy(procesos.orden);
  }

  private calcularPorcentajeConPesos(respuestasConPreguntas: any[]) {
  // ✅ NORMALIZAR TODOS los datos - Soporte snake_case Y camelCase
  const respuestasNormalizadas = respuestasConPreguntas.map(r => ({
    ...r,
    respuesta: Boolean(r.respuesta),  // Fuerza boolean
    // 🔥 FIX: Soporta AMBOS formatos (noAplica del frontend, no_aplica de DB)
    no_aplica: Boolean(r.no_aplica ?? r.noAplica ?? false),
    peso: Number(r.peso ?? 1)  // Fuerza number
  }));

  const aplicables = respuestasNormalizadas.filter(r => !r.no_aplica);
  
  if (aplicables.length === 0) return '0.00';

  const pesoAprobado = aplicables
    .filter(r => r.respuesta === true)  // ✅ === true EXPLÍCITO
    .reduce((sum, r) => sum + r.peso, 0);
    
  const pesoTotal = aplicables.reduce((sum, r) => sum + r.peso, 0);

  const porcentaje = ((pesoAprobado / pesoTotal) * 100).toFixed(2);
  
  // DEBUG TEMPORAL - Quitar después
  /* console.log('🔢 DEBUG CALCULO FINAL:');
  console.log('  Total respuestas:', respuestasNormalizadas.length);
  console.log('  Aplicables:', aplicables.length);
  console.log('  Peso aprobado:', pesoAprobado);
  console.log('  Peso total:', pesoTotal);
  console.log('  Porcentaje:', porcentaje); */
  
  return porcentaje;
}


  async getProceso(id_proceso: number) {
    const result = await db
      .select()
      .from(procesos)
      .where(eq(procesos.id_proceso, id_proceso))
      .limit(1);
    return result[0] || null;
  }

  async getPreguntasByProceso(id_proceso: number) {
    return await db
      .select()
      .from(preguntas)
      .where(eq(preguntas.id_proceso, id_proceso))
      .orderBy(preguntas.orden);
  }

  async getPreguntasByCategoriaDirecta(id_categoria: number) {
    return await db
      .select()
      .from(preguntas)
      .where(
        and(
          or(
            isNull(preguntas.id_proceso),
            eq(preguntas.id_proceso, 0)
          ),
          eq(preguntas.id_categoria, id_categoria)
        )
      )
      .orderBy(preguntas.orden);
  }

  async getCategoria(id: number) {
    const result = await db
      .select()
      .from(categorias)
      .where(eq(categorias.id_categoria, id))
      .limit(1);
    return result[0] || null;
  }

  async getCategorias() {
    return await db.select().from(categorias).orderBy(categorias.id_categoria);
  }

  // -----------------------------
  // Empleados
  // -----------------------------
  async getEmpleadoById(id_empleado: string) {
    const result = await db
      .select()
      .from(empleados)
      .where(eq(empleados.id_empleado, id_empleado))
      .limit(1);
    return result[0] || null;
  }

  // -----------------------------
  // Evaluaciones
  // -----------------------------
  async createEvaluacionWithRespuestas(data: {
  idEmpleado: string;
  idCategoria: number;
  evaluador?: string;
  observaciones?: string;
  respuestas: Array<{ idPregunta: number; respuesta: boolean; noAplica?: boolean; comentarios?: string }>;
}) {
  return await db.transaction(async (tx) => {
    const idPreguntas = data.respuestas.map(r => r.idPregunta);
    let preguntasData: { id_pregunta: number; peso: number | null }[] = [];

    // ✅ CORREGIDO: Manejo correcto del tipo string → number
    for (const idPregunta of idPreguntas) {
      if (idPregunta !== null) {
        const result = await tx
          .select({ id_pregunta: preguntas.id_pregunta, peso: preguntas.peso })
          .from(preguntas)
          .where(eq(preguntas.id_pregunta, idPregunta))
          .limit(1);
        
        if (result[0]) {
          preguntasData.push({
            id_pregunta: result[0].id_pregunta,
            peso: result[0].peso ? parseFloat(result[0].peso as string) : null
          });
        }
      }
    }

    const respuestasConPesos = data.respuestas.map(resp => {
      const pregunta = preguntasData.find(p => p.id_pregunta === resp.idPregunta);
      return { ...resp, peso: pregunta?.peso ?? 1 };
    });

    // 🔥🔥🔥 DEBUG TEMPORAL - QUITAR DESPUÉS
    console.log('🔍=== DEBUG createEvaluacionWithRespuestas ===');
    console.log('📥 DATA.recpuestas:', JSON.stringify(data.respuestas, null, 2));
    console.log('⚖️  preguntasData:', JSON.stringify(preguntasData, null, 2));
    console.log('💰 respuestasConPesos:', JSON.stringify(respuestasConPesos, null, 2));
    
    const porcentaje = this.calcularPorcentajeConPesos(respuestasConPesos);
    
    console.log('🧮 APLICABLES (no_aplica=false):', JSON.stringify(
      respuestasConPesos.filter(r => !r.noAplica), null, 2
    ));
    console.log('✅ APROBADAS (aplicables + respuesta=true):', JSON.stringify(
      respuestasConPesos.filter(r => !r.noAplica && r.respuesta === true), null, 2
    ));
    console.log('📊 PORCENTAJE FINAL:', porcentaje);
    console.log('🔍=== FIN DEBUG ===\n');

    const [nuevaEvaluacion] = await tx
      .insert(evaluaciones)
      .values({
        idEmpleado: data.idEmpleado,
        idCategoria: data.idCategoria,
        evaluador: data.evaluador ?? null,
        observaciones: data.observaciones ?? null,
        estado: 'pendiente',
        porcentaje_original: porcentaje,
      })
      .returning();

    await tx.insert(respuestas).values(
      data.respuestas.map(r => ({
        idEvaluacion: nuevaEvaluacion.idEvaluacion,
        idPregunta: r.idPregunta,
        respuesta: r.respuesta,
        no_aplica: r.noAplica ?? false,
        comentarios: r.comentarios ?? null,
      }))
    );

    await tx.insert(historial_evaluaciones).values({
      idEvaluacion: nuevaEvaluacion.idEvaluacion,
      porcentaje,
      modificadoPor: 'Empleado',
      esOriginal: true,
    });

    return nuevaEvaluacion;
  });
}








  async getEvaluacionesByEmpleado(idEmpleado: string) {
    return await db
      .select({
        idEvaluacion: evaluaciones.idEvaluacion,
        fechaEvaluacion: sql`to_char(${evaluaciones.fechaEvaluacion}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
        categoria: categorias.nombre,
        estado: evaluaciones.estado,
      })
      .from(evaluaciones)
      .leftJoin(categorias, eq(evaluaciones.idCategoria, categorias.id_categoria))
      .where(eq(evaluaciones.idEmpleado, idEmpleado))
      .orderBy(evaluaciones.fechaEvaluacion);
  }

  async getEvaluacionCompleta(idEvaluacion: number) {
  const result = await db
    .select({
      idEvaluacion: evaluaciones.idEvaluacion,
      idEmpleado: evaluaciones.idEmpleado,
      idCategoria: evaluaciones.idCategoria,
      fechaEvaluacion: evaluaciones.fechaEvaluacion,
      evaluador: evaluaciones.evaluador,
      observaciones: evaluaciones.observaciones,
      estado: evaluaciones.estado,
      porcentaje_original: evaluaciones.porcentaje_original,
      categoria: categorias.nombre,
      area: categorias.area,
      idPregunta: respuestas.idPregunta,
      respuesta: respuestas.respuesta,
      no_aplica: respuestas.no_aplica,  // ✅ NUEVO
      comentarios: respuestas.comentarios,
      tituloPregunta: preguntas.titulo,
      peso: preguntas.peso,  // ✅ PARA CÁLCULOS
      procesoNombre: procesos.nombre,
      nombreEmpleado: empleados.empleado,
    })
    .from(evaluaciones)
    .leftJoin(categorias, eq(evaluaciones.idCategoria, categorias.id_categoria))
    .leftJoin(respuestas, eq(respuestas.idEvaluacion, evaluaciones.idEvaluacion))
    .leftJoin(preguntas, eq(preguntas.id_pregunta, respuestas.idPregunta))
    .leftJoin(procesos, eq(procesos.id_proceso, preguntas.id_proceso))
    .leftJoin(empleados, eq(evaluaciones.idEmpleado, empleados.id_empleado))
    .where(eq(evaluaciones.idEvaluacion, idEvaluacion))
    .orderBy(preguntas.orden, respuestas.idPregunta);

  if (!result.length) return null;

  // 2️⃣ Obtener historial
  const historial = await this.getHistorialEvaluacion(idEvaluacion);

  // porcentaje_original → registro con esOriginal = true
  const porcentaje_original = historial.find(h => h.esOriginal)?.porcentaje
    ? Number(historial.find(h => h.esOriginal)?.porcentaje)
    : Number(result[0].porcentaje_original || 0);

  // porcentaje_actual → último registro del historial (más reciente)
  const porcentaje_actual = historial.length > 0
    ? Number(historial[historial.length - 1].porcentaje)
    : porcentaje_original;

  // 3️⃣ Normalizar resultado - ✅ FIX CRÍTICO AQUÍ
  const primeraFila = result[0];
  return {
    idEvaluacion: primeraFila.idEvaluacion,
    idEmpleado: primeraFila.idEmpleado,
    empleadoNombre: primeraFila.nombreEmpleado,
    idCategoria: primeraFila.idCategoria,
    fechaEvaluacion: primeraFila.fechaEvaluacion,
    evaluador: primeraFila.evaluador,
    observaciones: primeraFila.observaciones,
    estado: primeraFila.estado,
    porcentaje_original, // autoevaluación
    porcentaje_actual,   // evaluación final
    historial: historial.map(h => ({
      porcentaje: Number(h.porcentaje),
      fechaModificacion: h.fechaModificacion,
      modificadoPor: h.modificadoPor,
      esOriginal: h.esOriginal
    })),
    categoria: primeraFila.categoria,
    area: primeraFila.area,
    proceso: primeraFila.procesoNombre || null,
    respuestas: result.map(fila => ({
      idPregunta: fila.idPregunta!,
      respuesta: fila.respuesta!,
      comentarios: fila.comentarios,
      titulo: fila.tituloPregunta!,
      peso: fila.peso ? parseFloat(fila.peso as string) : 1,     // ✅ FIX: parseFloat
      no_aplica: Boolean(fila.no_aplica ?? false)                // ✅ FIX: Boolean explícito
    }))
  };
}


  async getAllEvaluaciones() {
    return await db
      .select({
        idEvaluacion: evaluaciones.idEvaluacion,
        fechaEvaluacion: sql`to_char(${evaluaciones.fechaEvaluacion}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
        estado: evaluaciones.estado,
        observaciones: evaluaciones.observaciones,
        idEmpleado: empleados.id_empleado,
        nombreEmpleado: empleados.empleado,
        areaEmpleado: empleados.area,
        categoria: categorias.nombre,
        nivelCategoria: categorias.nivel,
        areaCategoria: categorias.area,
        evaluador: evaluaciones.evaluador,
      })
      .from(evaluaciones)
      .leftJoin(empleados, eq(evaluaciones.idEmpleado, empleados.id_empleado))
      .leftJoin(categorias, eq(evaluaciones.idCategoria, categorias.id_categoria))
      .orderBy(desc(evaluaciones.fechaEvaluacion));
  }

  // -----------------------------
  // Actualización y eliminación
  // -----------------------------
  async updateEvaluacionEstado(idEvaluacion: number, estado: string) {
    const [updated] = await db
      .update(evaluaciones)
      .set({ estado })
      .where(eq(evaluaciones.idEvaluacion, idEvaluacion))
      .returning();
    return updated;
  }

  

  async deleteEvaluacionCompleta(idEvaluacion: number) {
    return await db.transaction(async (tx) => {
      await tx.delete(respuestas).where(eq(respuestas.idEvaluacion, idEvaluacion));
      const [deleted] = await tx
        .delete(evaluaciones)
        .where(eq(evaluaciones.idEvaluacion, idEvaluacion))
        .returning();
      return deleted;
    });
  }

  async updateEvaluacionConEvaluador(
  idEvaluacion: number, 
  estado: string, 
  evaluador: string
) {
  const [updated] = await db
    .update(evaluaciones)
    .set({ 
      estado,
      evaluador  // ← Actualiza también el evaluador
    })
    .where(eq(evaluaciones.idEvaluacion, idEvaluacion))
    .returning();
  return updated;
}

async updateEvaluacionEstadoConEvaluador(
  idEvaluacion: number, 
  estado: string, 
  evaluador: string
) {
  const [updated] = await db
    .update(evaluaciones)
    .set({ 
      estado,
      evaluador  // ← ACTUALIZA EL EVALUADOR DEL SUPERVISOR
    })
    .where(eq(evaluaciones.idEvaluacion, idEvaluacion))
    .returning();
  return updated;
}

// ================================
// 🔹 NUEVOS MÉTODOS - HISTORIAL DE EVALUACIONES
// ================================

/**
 * 🔹 Finalizar evaluación del empleado (guarda % original)
 */
async finalizarEvaluacion(
  idEvaluacion: number, 
  respuestas: Array<{ idPregunta: number; respuesta: boolean }>
) {
  const total = respuestas.length;
  const aprobadas = respuestas.filter(r => r.respuesta).length;
  const porcentaje = ((aprobadas / total) * 100).toFixed(2); // 🔹 STRING!
  
  return await db.transaction(async (tx) => {
    // 1. Guardar % original (como STRING)
    await tx
      .update(evaluaciones)
      .set({ 
        porcentaje_original: porcentaje // ✅ Ya es string
      })
      .where(
        and(
          eq(evaluaciones.idEvaluacion, idEvaluacion),
          or(
            eq(evaluaciones.porcentaje_original, "0.00"),
            isNull(evaluaciones.porcentaje_original)
          )
        )
      )
      .execute();

    // 2. Insertar historial
    await tx.insert(historial_evaluaciones).values({
      idEvaluacion,
      porcentaje: porcentaje, // ✅ String
      modificadoPor: 'Empleado',
      esOriginal: true
    });

    return { 
      success: true, 
      porcentaje_original: parseFloat(porcentaje) // 🔹 Number para frontend
    };
  });
}

/**
 * 🔹 Guardar cambios del evaluador (nuevo historial)
 */
async guardarCambiosEvaluador(
  idEvaluacion: number,
  respuestasData: Array<{ idPregunta: number; respuesta: boolean; noAplica?: boolean }>,
  evaluador: string
) {
  return await db.transaction(async (tx) => {
    const todasRespuestas = await tx
      .select()
      .from(respuestas)
      .where(eq(respuestas.idEvaluacion, idEvaluacion));

    let preguntasData: { id_pregunta: number; peso: number | null }[] = [];
    const idPreguntas = todasRespuestas.map(r => r.idPregunta);

    // Obtener pesos...
    for (const idPregunta of idPreguntas) {
      if (idPregunta !== null) {
        const result = await tx
          .select({ id_pregunta: preguntas.id_pregunta, peso: preguntas.peso })
          .from(preguntas)
          .where(eq(preguntas.id_pregunta, idPregunta))
          .limit(1);
        if (result[0]) {
          preguntasData.push({
            id_pregunta: result[0].id_pregunta,
            peso: result[0].peso ? parseFloat(result[0].peso as string) : null
          });
        }
      }
    }

    // 🔥🔥 FIX: NORMALIZAR snake_case → camelCase
    const respuestasNormalizadas = todasRespuestas.map(resp => {
      const cambio = respuestasData.find(c => c.idPregunta === resp.idPregunta);
      
      return {
        ...resp,
        // Normalizar nombres para consistencia
        noAplica: cambio?.noAplica !== undefined ? cambio.noAplica : (resp.no_aplica ?? false),
        // Mantener ambos para compatibilidad
        no_aplica: cambio?.noAplica !== undefined ? cambio.noAplica : (resp.no_aplica ?? false),
        respuesta: cambio ? cambio.respuesta : resp.respuesta,
        peso: preguntasData.find(p => p.id_pregunta === resp.idPregunta)?.peso ?? 1
      };
    });

    const porcentajeNuevo = this.calcularPorcentajeConPesos(respuestasNormalizadas);

    console.log('🔍=== DEBUG guardarCambiosEvaluador ===');
    console.log('📥 CAMBIOS:', JSON.stringify(respuestasData, null, 2));
    console.log('💰 TODAS (6):', respuestasNormalizadas.length);
    console.log('💰 APLICABLES:', respuestasNormalizadas.filter(r => !r.noAplica).length);
    console.log('📊 NUEVO PORCENTAJE:', porcentajeNuevo);
    console.log('🔍=== FIN DEBUG ===');

    // Actualizar DB (solo campos que cambian)
    for (const cambio of respuestasData) {
      await tx.update(respuestas)
        .set({
          respuesta: cambio.respuesta,
          no_aplica: cambio.noAplica ?? sql`respuestas.no_aplica`
        })
        .where(
          and(
            eq(respuestas.idEvaluacion, idEvaluacion),
            eq(respuestas.idPregunta, cambio.idPregunta)
          )
        )
        .execute();
    }

    await tx.insert(historial_evaluaciones).values({
      idEvaluacion,
      porcentaje: porcentajeNuevo,
      modificadoPor: evaluador,
      esOriginal: false,
    });

    return {
      success: true,
      porcentaje_final: parseFloat(porcentajeNuevo),
      total_preguntas: 6,
      total_aplicables: respuestasNormalizadas.filter(r => !r.noAplica).length,
      total_actualizadas: respuestasData.length
    };
  });
}








/**
 * 🔹 Obtener historial completo de una evaluación
 */
async getHistorialEvaluacion(idEvaluacion: number) {
  return await db
    .select()
    .from(historial_evaluaciones)
    .where(eq(historial_evaluaciones.idEvaluacion, idEvaluacion))
    .orderBy(historial_evaluaciones.fechaModificacion) // ASC → primero auto, luego final
    .limit(10);
}


/**
 * 🔹 Obtener RESUMEN de porcentajes (para listas)
 */
async getResumenPorcentajes(idEvaluacion: number) {
  const [original] = await db
    .select({ porcentaje: evaluaciones.porcentaje_original })
    .from(evaluaciones)
    .where(eq(evaluaciones.idEvaluacion, idEvaluacion));

  const historial = await db
  .select()
  .from(historial_evaluaciones)
  .where(eq(historial_evaluaciones.idEvaluacion, idEvaluacion))
  .orderBy(historial_evaluaciones.fechaModificacion); // ASC

const registroOriginal = historial.find(h => h.esOriginal);

const porcentaje_original = registroOriginal
  ? parseFloat(registroOriginal.porcentaje)
  : original?.porcentaje
    ? parseFloat(original.porcentaje)
    : 0;

const porcentaje_final = historial.length > 0 
  ? parseFloat(historial[historial.length - 1].porcentaje)
  : porcentaje_original;

return {
  porcentaje_original,
  porcentaje_actual: porcentaje_final,
  tiene_historial: historial.length > 0
};
}


}
