// src/migrate.ts
import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from './db/schema';

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Configuración SSL específica para Supabase Pooler
    ssl: {
      rejectUnauthorized: false,
    },
    // IMPORTANTE: Deshabilitar prepared statements para Transaction Pooler
    statement_timeout: false,
    // pgBouncer necesita esto para migrations
    options: '-c statement_timeout=0',
  });

  const db = drizzle(pool, { schema });

  try {
    console.log('[migrate] Running migrations...');
    await migrate(db, { migrationsFolder: 'src/db/migrations' });
    console.log('[migrate] ✅ Migrations finished!');
  } catch (err) {
    console.error('[migrate] ❌ Error during migrations:', err);
  } finally {
    await pool.end();
  }
}

runMigrations();
