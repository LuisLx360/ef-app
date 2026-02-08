// src/db/db.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres'; // ✅ Cambio aquí
import { 
  categorias, 
  procesos, 
  preguntas, 
  empleados, 
  evaluaciones, 
  respuestas, 
  historial_evaluaciones 
} from './schema.js';
import { eq, isNull, and, or, desc, sql } from 'drizzle-orm';

@Injectable()
export class DbService implements OnModuleInit {
  public db: any;

  // src/db/db.service.ts
async onModuleInit() {
  let retries = 0;
  const maxRetries = 10;
  
  while (retries < maxRetries) {
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL!,
        ssl: { 
          rejectUnauthorized: false  // ← Supabase necesita esto
        },
        connectionTimeoutMillis: 30000,  // ↑ Más tiempo para Supabase
        idleTimeoutMillis: 60000,
        max: 5,  // Pool más pequeño
        allowExitOnIdle: false
      });
      
      await pool.query('SELECT 1');
      this.db = drizzle(pool);
      console.log('✅ Supabase + Drizzle conectado!');
      return;
      
    } catch (error: any) {
      retries++;
      console.warn(`⚠️ Conexión falló (intento ${retries}/${maxRetries}):`, error.message);
      
      if (retries >= maxRetries) {
        console.error('❌ No se pudo conectar después de', maxRetries, 'intentos');
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000 * retries));
    }
  }
}


  // Resto de getters y métodos sin cambios...
  get empleados() { return this.db.query.empleados; }
  get categorias() { return this.db.query.categorias; }
  get evaluaciones() { return this.db.query.evaluaciones; }

  // -----------------------------
  // Categorías y Procesos
  // -----------------------------
  async getProcesosByCategoria(id_categoria: number) {
    return await this.db
      .select()
      .from(procesos)
      .where(eq(procesos.id_categoria, id_categoria))
      .orderBy(procesos.orden);
  }

  private calcularPorcentajeConPesos(respuestasConPreguntas: any[]) {
    const respuestasNormalizadas = respuestasConPreguntas.map(r => ({
      ...r,
      respuesta: Boolean(r.respuesta),
      no_aplica: Boolean(r.no_aplica ?? r.noAplica ?? false),
      peso: Number(r.peso ?? 1)
    }));

    const aplicables = respuestasNormalizadas.filter(r => !r.no_aplica);
    if (aplicables.length === 0) return '0.00';

    const pesoAprobado = aplicables
      .filter(r => r.respuesta === true)
      .reduce((sum, r) => sum + r.peso, 0);
    const pesoTotal = aplicables.reduce((sum, r) => sum + r.peso, 0);

    return ((pesoAprobado / pesoTotal) * 100).toFixed(2);
  }

  async getProceso(id_proceso: number) {
    const result = await this.db
      .select()
      .from(procesos)
      .where(eq(procesos.id_proceso, id_proceso))
      .limit(1);
    return result[0] || null;
  }

  async getPreguntasByProceso(id_proceso: number) {
    return await this.db
      .select()
      .from(preguntas)
      .where(eq(preguntas.id_proceso, id_proceso))
      .orderBy(preguntas.orden);
  }

  async getPreguntasByCategoriaDirecta(id_categoria: number) {
    return await this.db
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
    const result = await this.db
      .select()
      .from(categorias)
      .where(eq(categorias.id_categoria, id))
      .limit(1);
    return result[0] || null;
  }

  async getCategorias() {
    return await this.db.select().from(categorias).orderBy(categorias.id_categoria);
  }

  // -----------------------------
  // Empleados
  // -----------------------------
  async getEmpleadoById(id_empleado: string) {
    const result = await this.db
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
    return await this.db.transaction(async (tx) => {
      const idPreguntas = data.respuestas.map(r => r.idPregunta);
      let preguntasData: { id_pregunta: number; peso: number | null }[] = [];

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

      const porcentaje = this.calcularPorcentajeConPesos(respuestasConPesos);

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









    // -----------------------------
  // Evaluaciones (continuación)
  // -----------------------------
  async getEvaluacionesByEmpleado(idEmpleado: string) {
    return await this.db
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
    const result = await this.db
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
        no_aplica: respuestas.no_aplica,
        comentarios: respuestas.comentarios,
        tituloPregunta: preguntas.titulo,
        peso: preguntas.peso,
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

    const historial = await this.getHistorialEvaluacion(idEvaluacion);

    const porcentaje_original = historial.find(h => h.esOriginal)?.porcentaje
      ? Number(historial.find(h => h.esOriginal)?.porcentaje)
      : Number(result[0].porcentaje_original || 0);

    const porcentaje_actual = historial.length > 0
      ? Number(historial[historial.length - 1].porcentaje)
      : porcentaje_original;

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
      porcentaje_original,
      porcentaje_actual,
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
        peso: fila.peso ? parseFloat(fila.peso as string) : 1,
        no_aplica: Boolean(fila.no_aplica ?? false)
      }))
    };
  }

  async getAllEvaluaciones() {
    return await this.db
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
    const [updated] = await this.db
      .update(evaluaciones)
      .set({ estado })
      .where(eq(evaluaciones.idEvaluacion, idEvaluacion))
      .returning();
    return updated;
  }

  async deleteEvaluacionCompleta(idEvaluacion: number) {
    return await this.db.transaction(async (tx) => {
      await tx.delete(respuestas).where(eq(respuestas.idEvaluacion, idEvaluacion));
      const [deleted] = await tx
        .delete(evaluaciones)
        .where(eq(evaluaciones.idEvaluacion, idEvaluacion))
        .returning();
      return deleted;
    });
  }

  async updateEvaluacionConEvaluador(idEvaluacion: number, estado: string, evaluador: string) {
    const [updated] = await this.db
      .update(evaluaciones)
      .set({ estado, evaluador })
      .where(eq(evaluaciones.idEvaluacion, idEvaluacion))
      .returning();
    return updated;
  }

  async updateEvaluacionEstadoConEvaluador(idEvaluacion: number, estado: string, evaluador: string) {
    const [updated] = await this.db
      .update(evaluaciones)
      .set({ estado, evaluador })
      .where(eq(evaluaciones.idEvaluacion, idEvaluacion))
      .returning();
    return updated;
  }

  // -----------------------------
  // Historial de evaluaciones
  // -----------------------------
  async finalizarEvaluacion(idEvaluacion: number, respuestas: Array<{ idPregunta: number; respuesta: boolean }>) {
    const total = respuestas.length;
    const aprobadas = respuestas.filter(r => r.respuesta).length;
    const porcentaje = ((aprobadas / total) * 100).toFixed(2);

    return await this.db.transaction(async (tx) => {
      await tx
        .update(evaluaciones)
        .set({ porcentaje_original: porcentaje })
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

      await tx.insert(historial_evaluaciones).values({
        idEvaluacion,
        porcentaje,
        modificadoPor: 'Empleado',
        esOriginal: true
      });

      return { success: true, porcentaje_original: parseFloat(porcentaje) };
    });
  }

  async guardarCambiosEvaluador(
    idEvaluacion: number,
    respuestasData: Array<{ idPregunta: number; respuesta: boolean; noAplica?: boolean }>,
    evaluador: string
  ) {
    return await this.db.transaction(async (tx) => {
      const todasRespuestas = await tx
        .select()
        .from(respuestas)
        .where(eq(respuestas.idEvaluacion, idEvaluacion));

      let preguntasData: { id_pregunta: number; peso: number | null }[] = [];
      const idPreguntas = todasRespuestas.map(r => r.idPregunta);

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

      const respuestasNormalizadas = todasRespuestas.map(resp => {
        const cambio = respuestasData.find(c => c.idPregunta === resp.idPregunta);
        return {
          ...resp,
          noAplica: cambio?.noAplica !== undefined ? cambio.noAplica : (resp.no_aplica ?? false),
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

  async getHistorialEvaluacion(idEvaluacion: number) {
    return await this.db
      .select()
      .from(historial_evaluaciones)
      .where(eq(historial_evaluaciones.idEvaluacion, idEvaluacion))
      .orderBy(historial_evaluaciones.fechaModificacion)
      .limit(10);
  }

  async getResumenPorcentajes(idEvaluacion: number) {
    const [original] = await this.db
      .select({ porcentaje: evaluaciones.porcentaje_original })
      .from(evaluaciones)
      .where(eq(evaluaciones.idEvaluacion, idEvaluacion));

    const historial = await this.db
      .select()
      .from(historial_evaluaciones)
      .where(eq(historial_evaluaciones.idEvaluacion, idEvaluacion))
      .orderBy(historial_evaluaciones.fechaModificacion);

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

