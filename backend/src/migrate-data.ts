// src/migrate-data.ts
import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './db/schema';

async function migrate() {
  console.log('🚀 INICIANDO MIGRACIÓN DE DATOS...');

  const supabasePool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
    // IMPORTANTE para transaction pooler
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  const supabaseDb = drizzle(supabasePool);

  // Tu código local...
  const localPool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres360',
    database: 'Data_EF',
  });
  const localDb = drizzle(localPool);


  // ORDEN IMPORTANTE POR FK
  console.log('👥 Migrando empleados...');
  const empleadosLocal = await localDb.select().from(schema.empleados);
  await supabaseDb.insert(schema.empleados).values(empleadosLocal).onConflictDoNothing();

  console.log('📂 Migrando categorías...');
  const categoriasLocal = await localDb.select().from(schema.categorias);
  await supabaseDb.insert(schema.categorias).values(categoriasLocal).onConflictDoNothing();

  console.log('⚙️ Migrando procesos...');
  const procesosLocal = await localDb.select().from(schema.procesos);
  await supabaseDb.insert(schema.procesos).values(procesosLocal).onConflictDoNothing();

  console.log('❓ Migrando preguntas...');
  const preguntasLocal = await localDb.select().from(schema.preguntas);
  await supabaseDb.insert(schema.preguntas).values(preguntasLocal).onConflictDoNothing();

  console.log('📊 Migrando evaluaciones...');
  const evaluacionesLocal = await localDb.select().from(schema.evaluaciones);
  await supabaseDb.insert(schema.evaluaciones).values(evaluacionesLocal).onConflictDoNothing();

  console.log('💬 Migrando respuestas...');
  const respuestasLocal = await localDb.select().from(schema.respuestas);
  await supabaseDb.insert(schema.respuestas).values(respuestasLocal).onConflictDoNothing();

  console.log('📈 Migrando historial...');
  const historialLocal = await localDb.select().from(schema.historial_evaluaciones);
  await supabaseDb.insert(schema.historial_evaluaciones).values(historialLocal).onConflictDoNothing();

  console.log('🎉 MIGRACIÓN COMPLETA');

  await localPool.end();
  await supabasePool.end();
}

migrate().catch(console.error);

