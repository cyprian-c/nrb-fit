import dotenv from 'dotenv'
import { neon } from '@neondatabase/serverless'
import path from 'node:path'
import pg from 'pg'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Robustly load .env across workspace root, server dir, and process environment
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })
if (process.env.DOTENV_CONFIG_PATH) {
  dotenv.config({ path: process.env.DOTENV_CONFIG_PATH })
}
dotenv.config()

const { Pool } = pg
const databaseUrl = process.env.DATABASE_URL
const sql = databaseUrl ? neon(databaseUrl) : null

// Keep pg available for migration and seed scripts, which need interactive
// transactions. Request handlers use the HTTP driver below and do not hold a
// WebSocket connection open for each serverless request.
export const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
      allowExitOnIdle: true,
    })
  : null

if (pool) {
  pool.on('error', (err) => {
    console.error('[db] Unexpected pool error on idle client:', err)
  })
}

// Execute one parameterized HTTP query at a time and return a pg-shaped result
// so existing controllers do not need to know which Neon transport is used.
export async function query(text, params = []) {
  if (!sql) {
    throw new Error('DATABASE_URL must be set before running database queries.')
  }

  const startedAt = Date.now()

  try {
    const rows = await sql.query(text, params)
    console.info(`[db] Query completed in ${Date.now() - startedAt}ms`)
    return { rows, rowCount: rows.length }
  } catch (error) {
    console.error(`[db] Query failed after ${Date.now() - startedAt}ms`)
    throw error
  }
}