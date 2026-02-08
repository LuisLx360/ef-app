import 'dotenv/config';                 // carga .env
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

console.log('DATABASE_URL =>', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },   // 🔹 Supabase necesita esto
});

export const db = drizzle(pool, { schema });
export * from './schema';
