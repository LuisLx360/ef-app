// src/db/index.ts
import 'dotenv/config';                // 👈 añade esta línea al inicio
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

console.log('DATABASE_URL =>', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL as string,
});

export const db = drizzle(pool, { schema });
export * from './schema.js';