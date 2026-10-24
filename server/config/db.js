import dotenv from 'dotenv'
import { neon } from '@neondatabase/serverless'
import pg from 'pg'

// Local development may keep the shared workspace .env at the repository root,
// while deployed environments provide DATABASE_URL directly at process level.
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '../.env' })

const { Pool } = pg
const databaseUrl = process.env.DATABASE_URL
const sql = databaseUrl ? neon(databaseUrl) : null

// Keep pg available for migration and seed scripts, which need interactive
// transactions. Request handlers use the HTTP driver below and do not hold a
// WebSocket connection open for each serverless request.
export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
  allowExitOnIdle: true,
})

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