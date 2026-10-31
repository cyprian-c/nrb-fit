-- Migration: 006_create_users_table.sql
-- Users table for authentication and member management
-- Used by: authController.js, orderController.js, bookings, etc.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'admin', 'coach')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);


-- Migration: 007_create_coaches_table.sql
-- Coaches/instructors with their specialties and bios

CREATE TABLE IF NOT EXISTS coaches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialty VARCHAR(150),
  bio TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Migration: 008_create_memberships_table.sql
-- Membership plans/packages for the studio

CREATE TABLE IF NOT EXISTS memberships (
  id SERIAL PRIMARY KEY,
  label VARCHAR(100) NOT NULL, -- e.g., 'Monthly', 'Quarterly', 'Annual'
  title VARCHAR(150) NOT NULL, -- e.g., 'Standard Plan', 'Premium Access'
  price VARCHAR(20) NOT NULL, -- e.g., 'KSH 5,000' - store as formatted string
  description TEXT,
  perks TEXT, -- JSON array of perks as text
  featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Migration: 009_create_classes_table.sql
-- Group classes schedule

CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  time VARCHAR(10) NOT NULL, -- e.g., '05:45'
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  focus VARCHAR(100), -- e.g., 'Cardio', 'Strength', 'Flexibility'
  duration INTEGER NOT NULL, -- duration in minutes
  coach_id INTEGER REFERENCES coaches(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_classes_time ON classes(time);
CREATE INDEX IF NOT EXISTS idx_classes_category ON classes(category);
CREATE INDEX IF NOT EXISTS idx_classes_coach_id ON classes(coach_id);


-- Migration: 010_create_exercises_table.sql
-- Library of bodyweight exercises

CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  target_muscle VARCHAR(100),
  equipment VARCHAR(200), -- comma-separated list or 'none'
  instructions TEXT,
  tips TEXT
);


-- Migration: 011_create_training_programs_table.sql
-- Home workout programs with multiple sessions

CREATE TABLE IF NOT EXISTS training_programs (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  difficulty VARCHAR(50), -- 'Beginner', 'Intermediate', 'Advanced'
  duration_days INTEGER NOT NULL DEFAULT 7,
  description TEXT,
  banner_color VARCHAR(30),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_training_programs_slug ON training_programs(slug);
CREATE INDEX IF NOT EXISTS idx_training_programs_category ON training_programs(category);


-- Migration: 012_create_program_sessions_table.sql
-- Individual workout sessions within a training program

CREATE TABLE IF NOT EXISTS program_sessions (
  id SERIAL PRIMARY KEY,
  program_id INTEGER NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  estimated_duration_min INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_program_sessions_program_id ON program_sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_program_sessions_day ON program_sessions(program_id, day_number);


-- Migration: 013_create_session_exercises_table.sql
-- Exercises within each program session (with sets/reps/rounds)

CREATE TABLE IF NOT EXISTS session_exercises (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES program_sessions(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  reps VARCHAR(50), -- e.g., '12', '8-12', 'MAX'
  duration_seconds INTEGER, -- for time-based exercises
  rest_after_seconds INTEGER DEFAULT 60,
  sets INTEGER DEFAULT 3,
  rounds INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_session_exercises_session_id ON session_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_session_exercises_exercise_id ON session_exercises(exercise_id);


-- Migration: 014_create_bookings_table.sql
-- Studio class bookings

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_class_id ON bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_confirmed 
  ON bookings(user_id, class_id, booking_date) 
  WHERE status = 'confirmed';


-- Migration: 015_create_user_enrollments_table.sql
-- Training program enrollments for member portal

CREATE TABLE IF NOT EXISTS user_enrollments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_id INTEGER NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  current_day INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_enrollments_user_id ON user_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_program_id ON user_enrollments(program_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_enrollments_unique 
  ON user_enrollments(user_id, program_id);


-- Migration: 016_create_workout_logs_table.sql
-- Workout session logs

CREATE TABLE IF NOT EXISTS workout_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_id INTEGER REFERENCES training_programs(id),
  session_id INTEGER REFERENCES program_sessions(id),
  title VARCHAR(200) NOT NULL,
  duration_seconds INTEGER NOT NULL,
  calories_burned INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_program_id ON workout_logs(program_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_session_id ON workout_logs(session_id);


-- Migration: 017_create_user_alerts_table.sql
-- User notifications and alerts

CREATE TABLE IF NOT EXISTS user_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'welcome', 'program_enrolled', 'workout_completed'
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  action_url VARCHAR(300),
  is_read BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_type ON user_alerts(type);
CREATE INDEX IF NOT EXISTS idx_user_alerts_is_read ON user_alerts(is_read);