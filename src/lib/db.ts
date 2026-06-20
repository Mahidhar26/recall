import { Pool } from 'pg'

// Singleton pool — reuse across hot reloads in dev
declare global {
  var _pool: Pool | undefined
}

export const pool = global._pool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },  // Aurora requires SSL
})

if (process.env.NODE_ENV !== 'production') {
  global._pool = pool
}

// Helper for typed queries
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params)
  return result.rows as T[]
}
