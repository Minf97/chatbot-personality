import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDB() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

export async function queryDB(text: string, params?: any[]) {
  const client = getDB();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function closeDB() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}