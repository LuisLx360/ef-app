import { Injectable } from '@nestjs/common';
import { db } from './index.js';
import { categorias, procesos, preguntas, empleados, evaluaciones, respuestas } from './schema.js';
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
    respuestas: Array<{ idPregunta: number; respuesta: boolean; comentarios?: string }>;
  }) {
    return await db.transaction(async (tx) => {
      // 1. Insertar evaluación
      const [nuevaEvaluacion] = await tx.insert(evaluaciones)
        .values({
          idEmpleado: data.idEmpleado,
          idCategoria: data.idCategoria,
          evaluador: data.evaluador,
          observaciones: data.observaciones,
        })
        .returning();

      // 2. Insertar respuestas
      await tx.insert(respuestas).values(
        data.respuestas.map(r => ({
          idEvaluacion: nuevaEvaluacion.idEvaluacion,
          idPregunta: r.idPregunta,
          respuesta: r.respuesta,
          comentarios: r.comentarios,
        }))
      );

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
      categoria: categorias.nombre,
      area: categorias.area,
      idPregunta: respuestas.idPregunta,
      respuesta: respuestas.respuesta,
      comentarios: respuestas.comentarios,
      tituloPregunta: preguntas.titulo,
      procesoNombre: procesos.nombre,
      nombreEmpleado: empleados.empleado, // ← agregamos el nombre del empleado
    })
    .from(evaluaciones)
    .leftJoin(categorias, eq(evaluaciones.idCategoria, categorias.id_categoria))
    .leftJoin(respuestas, eq(respuestas.idEvaluacion, evaluaciones.idEvaluacion))
    .leftJoin(preguntas, eq(preguntas.id_pregunta, respuestas.idPregunta))
    .leftJoin(procesos, eq(procesos.id_proceso, preguntas.id_proceso))
    .leftJoin(empleados, eq(evaluaciones.idEmpleado, empleados.id_empleado)) // ← JOIN con empleados
    .where(eq(evaluaciones.idEvaluacion, idEvaluacion))
    .orderBy(preguntas.orden, preguntas.id_pregunta);

  if (!result.length) return null;

  const primeraFila = result[0];
  return {
    idEvaluacion: primeraFila.idEvaluacion,
    idEmpleado: primeraFila.idEmpleado,
    empleadoNombre: primeraFila.nombreEmpleado, // ← asignamos
    idCategoria: primeraFila.idCategoria,
    fechaEvaluacion: primeraFila.fechaEvaluacion,
    evaluador: primeraFila.evaluador,
    observaciones: primeraFila.observaciones,
    estado: primeraFila.estado,
    categoria: primeraFila.categoria,
    area: primeraFila.area,
    proceso: primeraFila.procesoNombre || null,
    respuestas: result.map(fila => ({
      idPregunta: fila.idPregunta!,
      respuesta: fila.respuesta!,
      comentarios: fila.comentarios,
      titulo: fila.tituloPregunta!,
    })),
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

  async updateRespuestas(
    idEvaluacion: number,
    respuestasData: Array<{ idPregunta: number; respuesta: boolean }>
  ) {
    await db.transaction(async (tx) => {
      for (const r of respuestasData) {
        await tx
          .update(respuestas)
          .set({ respuesta: r.respuesta })
          .where(
            and(
              eq(respuestas.idEvaluacion, idEvaluacion),
              eq(respuestas.idPregunta, r.idPregunta)
            )
          )
          .execute();
      }
    });
    return { success: true, updated: respuestasData.length };
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
}
