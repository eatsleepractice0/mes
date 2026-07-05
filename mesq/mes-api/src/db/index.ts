import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export async function checkDatabaseConnection(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    return false;
  }

  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
