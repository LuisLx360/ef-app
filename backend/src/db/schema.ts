import { pgTable, serial, varchar, text, timestamp, boolean, decimal, integer, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const empleados = pgTable('empleados', {
  id_empleado: varchar('id_empleado', { length: 10 }).primaryKey(),
  nivel_acceso: varchar('nivel_acceso', { length: 25 }).notNull(),
  empleado: varchar('empleado', { length: 150 }).notNull(),
  jefe_inmediato: varchar('jefe_inmediato', { length: 150 }).notNull(),
  area: varchar('area', { length: 20 }).notNull(),
  equipo_autonomo: varchar('equipo_autonomo', { length: 50 }),
});

export const categorias = pgTable('categorias', {
  id_categoria: serial('id_categoria').primaryKey(),
  nombre: varchar('nombre', { length: 100 }).unique().notNull(),
  nivel: varchar('nivel', { length: 10 }).notNull(),
  area: varchar('area', { length: 20 }).notNull(),
  descripcion: text('descripcion'),
});

export const procesos = pgTable('procesos', {
  id_proceso: serial('id_proceso').primaryKey(),
  id_categoria: integer('id_categoria').notNull(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  descripcion: text('descripcion'),
  orden: integer('orden').default(0),
});

export const preguntas = pgTable('preguntas', {
  id_pregunta: serial('id_pregunta').primaryKey(),
  id_categoria: integer('id_categoria').notNull(),
  id_proceso: integer('id_proceso'),  // puede ser null
  titulo: text('titulo').notNull(),
  descripcion: text('descripcion'),
  peso: decimal('peso', { precision: 3, scale: 2 }).default('1.00'),
  orden: integer('orden').default(0),
});

export const evaluaciones = pgTable('evaluaciones', {
  idEvaluacion: serial('id_evaluacion').primaryKey(),
  idEmpleado: varchar('id_empleado', { length: 10 }).references(() => empleados.id_empleado),
  idCategoria: integer('id_categoria').references(() => categorias.id_categoria),
  fechaEvaluacion: timestamp('fecha_evaluacion').defaultNow(),
  evaluador: varchar('evaluador', { length: 150 }),
  observaciones: text('observaciones'),
  estado: varchar('estado', { length: 20 }).default('pendiente'),
});

export const respuestas = pgTable('respuestas', {
  idRespuesta: serial('id_respuesta').primaryKey(),
  idEvaluacion: integer('id_evaluacion').references(() => evaluaciones.idEvaluacion),
  idPregunta: integer('id_pregunta').references(() => preguntas.id_pregunta),
  respuesta: boolean('respuesta').notNull(),
  comentarios: text('comentarios'),
}, (table) => [
  unique().on(table.idEvaluacion, table.idPregunta),
]);

// Opcional: Relations para TypeScript fuerte (agrega después de todas las tablas)
export const evaluacionesRelations = relations(evaluaciones, ({ one, many }) => ({
  empleado: one(empleados, {
    fields: [evaluaciones.idEmpleado],
    references: [empleados.id_empleado],
  }),
  categoria: one(categorias, {
    fields: [evaluaciones.idCategoria],
    references: [categorias.id_categoria],
  }),
  respuestas: many(respuestas),
}));

export const respuestasRelations = relations(respuestas, ({ one }) => ({
  evaluacion: one(evaluaciones, {
    fields: [respuestas.idEvaluacion],
    references: [evaluaciones.idEvaluacion],
  }),
  pregunta: one(preguntas, {
    fields: [respuestas.idPregunta],
    references: [preguntas.id_pregunta],
  }),
}));
