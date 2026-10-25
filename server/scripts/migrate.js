import { pool } from '../config/db.js'

// Keep the schema definitions together so the initial database setup can be
// applied atomically and rerun safely when a deployment is initialized again.
const schemaSql = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS coaches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    specialty VARCHAR(120) NOT NULL,
    bio TEXT NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    time VARCHAR(10) NOT NULL,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(60) NOT NULL,
    focus VARCHAR(255) NOT NULL,
    duration VARCHAR(20) NOT NULL DEFAULT '50 min',
    coach_id INTEGER REFERENCES coaches(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS memberships (
    id SERIAL PRIMARY KEY,
    label VARCHAR(80) NOT NULL,
    title VARCHAR(120) NOT NULL,
    price VARCHAR(30) NOT NULL,
    suffix VARCHAR(30) NOT NULL,
    description TEXT NOT NULL,
    perks JSONB NOT NULL DEFAULT '[]'::jsonb,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS enquiries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    interest VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  ALTER TABLE enquiries
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'new';

  -- 7. Training Programs (e.g. Full Body Blitz, Core Shred)
  CREATE TABLE IF NOT EXISTS training_programs (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(80) UNIQUE NOT NULL,
    title VARCHAR(120) NOT NULL,
    category VARCHAR(60) NOT NULL,
    difficulty VARCHAR(30) NOT NULL DEFAULT 'intermediate',
    duration_days INTEGER NOT NULL DEFAULT 28,
    description TEXT NOT NULL,
    banner_color VARCHAR(30) DEFAULT '#84ae00',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- 8. Exercises Library
  CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    target_muscle VARCHAR(60) NOT NULL,
    equipment VARCHAR(60) NOT NULL DEFAULT 'none',
    instructions TEXT NOT NULL,
    tips TEXT,
    default_duration_seconds INTEGER DEFAULT 30,
    default_reps INTEGER DEFAULT 12,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- 9. Program Sessions (Daily scheduled workouts within a program)
  CREATE TABLE IF NOT EXISTS program_sessions (
    id SERIAL PRIMARY KEY,
    program_id INTEGER NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    title VARCHAR(120) NOT NULL,
    estimated_duration_min INTEGER NOT NULL DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_program_day UNIQUE(program_id, day_number)
  );

  -- 10. Session Exercises (Ordered exercises for each workout session)
  CREATE TABLE IF NOT EXISTS session_exercises (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES program_sessions(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 1,
    reps INTEGER,
    duration_seconds INTEGER,
    rest_after_seconds INTEGER NOT NULL DEFAULT 30
  );

  -- 11. User Program Enrollments (Active member training progress)
  CREATE TABLE IF NOT EXISTS user_enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id INTEGER NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    current_day INTEGER NOT NULL DEFAULT 1,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_program UNIQUE(user_id, program_id)
  );

  -- 12. Workout Logs (Member completion history, stats & streaks)
  CREATE TABLE IF NOT EXISTS workout_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES training_programs(id) ON DELETE SET NULL,
    session_id INTEGER REFERENCES program_sessions(id) ON DELETE SET NULL,
    title VARCHAR(120) NOT NULL,
    duration_seconds INTEGER NOT NULL,
    calories_burned INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- 13. User Activity Alerts & Reminders
  CREATE TABLE IF NOT EXISTS user_alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(140) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(120),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- Performance indexes for portal queries
  CREATE INDEX IF NOT EXISTS idx_program_sessions_program ON program_sessions(program_id);
  CREATE INDEX IF NOT EXISTS idx_session_exercises_session ON session_exercises(session_id);
  CREATE INDEX IF NOT EXISTS idx_user_enrollments_user ON user_enrollments(user_id);
  CREATE INDEX IF NOT EXISTS idx_workout_logs_user ON workout_logs(user_id, completed_at DESC);
  CREATE INDEX IF NOT EXISTS idx_user_alerts_user ON user_alerts(user_id, is_read, scheduled_for DESC);
`

async function migrate() {
  if (!pool) {
    console.error('DATABASE_URL must be configured before running database migrations.')
    process.exitCode = 1
    return
  }
  let client

  try {
    client = await pool.connect()
    await client.query('BEGIN')
    await client.query(schemaSql)
    await client.query('COMMIT')
    console.info('Database schema migration completed successfully.')
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('Database migration rollback failed:', rollbackError.message)
      }
    }

    console.error('Database schema migration failed:', error.message)
    process.exitCode = 1
  } finally {
    client?.release()
    await pool.end()
  }
}

await migrate()