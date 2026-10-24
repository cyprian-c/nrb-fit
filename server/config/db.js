import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg
const databaseUrl = process.env.DATABASE_URL

// Reuse a small set of connections through Neon's pooled endpoint instead of
// opening a new PostgreSQL connection for every request.
export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
  allowExitOnIdle: true,
})

// Serverless processes and Neon can suspend while idle, so idle connections
// are released quickly and connection attempts fail instead of hanging.
export async function query(text, params = []) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set before running database queries.')
  }

  const startedAt = Date.now()

  try {
    const result = await pool.query(text, params)
    console.info(`[db] Query completed in ${Date.now() - startedAt}ms`)
    return result
  } catch (error) {
    console.error(`[db] Query failed after ${Date.now() - startedAt}ms`)
    throw error
  }
}