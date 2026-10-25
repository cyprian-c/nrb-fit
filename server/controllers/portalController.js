import { query } from '../config/db.js'

/**
 * Portal Controller: Serves home workout programs, user enrollments,
 * guided workout logs, training streak statistics, and activity alerts.
 */

// 1. List all available training programs
export async function getPrograms(request, response, next) {
  try {
    const result = await query(
      `SELECT
         p.id,
         p.slug,
         p.title,
         p.category,
         p.difficulty,
         p.duration_days,
         p.description,
         p.banner_color,
         COUNT(s.id)::integer AS session_count
       FROM training_programs p
       LEFT JOIN program_sessions s ON s.program_id = p.id
       GROUP BY p.id
       ORDER BY p.id ASC`,
    )

    response.json({ programs: result.rows })
  } catch (error) {
    next(error)
  }
}

// 2. Get single program with ordered daily sessions and exercise routines
export async function getProgramBySlug(request, response, next) {
  const { slug } = request.params

  try {
    const isNumeric = /^\d+$/.test(slug)
    const progResult = await query(
      `SELECT id, slug, title, category, difficulty, duration_days, description, banner_color
       FROM training_programs
       WHERE slug = $1 ${isNumeric ? 'OR id = $2' : ''}
       LIMIT 1`,
      isNumeric ? [slug, Number(slug)] : [slug],
    )

    if (progResult.rowCount === 0) {
      response.status(404).json({ error: 'Program not found.' })
      return
    }

    const program = progResult.rows[0]

    // Fetch sessions
    const sessionsResult = await query(
      `SELECT id, day_number, title, estimated_duration_min
       FROM program_sessions
       WHERE program_id = $1
       ORDER BY day_number ASC`,
      [program.id],
    )
    const sessions = sessionsResult.rows

    if (sessions.length > 0) {
      const sessionIds = sessions.map((s) => s.id)
      const exercisesResult = await query(
        `SELECT
           se.id AS session_exercise_id,
           se.session_id,
           se.sort_order,
           se.reps,
           se.duration_seconds,
           se.rest_after_seconds,
           e.id AS exercise_id,
           e.name,
           e.target_muscle,
           e.equipment,
           e.instructions,
           e.tips
         FROM session_exercises se
         JOIN exercises e ON e.id = se.exercise_id
         WHERE se.session_id = ANY($1)
         ORDER BY se.session_id, se.sort_order ASC`,
        [sessionIds],
      )

      const exercisesBySession = new Map()
      for (const ex of exercisesResult.rows) {
        if (!exercisesBySession.has(ex.session_id)) {
          exercisesBySession.set(ex.session_id, [])
        }
        exercisesBySession.get(ex.session_id).push(ex)
      }

      for (const session of sessions) {
        session.exercises = exercisesBySession.get(session.id) || []
      }
    }

    response.json({
      program: {
        ...program,
        sessions,
      },
    })
  } catch (error) {
    next(error)
  }
}

// 3. Enroll authenticated member into a training program
export async function enrollProgram(request, response, next) {
  const userId = request.user.id
  const programId = Number(request.body?.program_id)

  if (!Number.isInteger(programId) || programId < 1) {
    response.status(400).json({ error: 'Valid program_id is required.' })
    return
  }

  try {
    const progCheck = await query(
      'SELECT id, slug, title FROM training_programs WHERE id = $1 LIMIT 1',
      [programId],
    )
    if (progCheck.rowCount === 0) {
      response.status(404).json({ error: 'Program not found.' })
      return
    }

    const program = progCheck.rows[0]

    const result = await query(
      `INSERT INTO user_enrollments (user_id, program_id, status, current_day, updated_at)
       VALUES ($1, $2, 'active', 1, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, program_id) DO UPDATE
       SET status = 'active', updated_at = CURRENT_TIMESTAMP
       RETURNING id, user_id, program_id, status, current_day, started_at, updated_at`,
      [userId, programId],
    )

    // Create an enrollment welcome alert
    await query(
      `INSERT INTO user_alerts (user_id, type, title, message, action_url)
       VALUES ($1, 'program_enrolled', $2, $3, $4)`,
      [
        userId,
        `Enrolled in ${program.title}!`,
        'Your daily training program is ready. Head to Day 1 to complete your first session.',
        `/portal/programs/${program.slug || programId}`,
      ],
    )

    response.status(201).json({
      message: `Enrolled successfully in ${program.title}.`,
      enrollment: result.rows[0],
    })
  } catch (error) {
    next(error)
  }
}

// 4. Get active enrollments for current member
export async function getMyEnrollments(request, response, next) {
  const userId = request.user.id

  try {
    const result = await query(
      `SELECT
         ue.id,
         ue.user_id,
         ue.program_id,
         ue.status,
         ue.current_day,
         ue.started_at,
         ue.updated_at,
         p.slug,
         p.title,
         p.category,
         p.difficulty,
         p.duration_days,
         p.banner_color,
         COUNT(DISTINCT wl.id)::integer AS completed_sessions
       FROM user_enrollments ue
       JOIN training_programs p ON p.id = ue.program_id
       LEFT JOIN workout_logs wl ON wl.user_id = ue.user_id AND wl.program_id = ue.program_id
       WHERE ue.user_id = $1
       GROUP BY ue.id, p.id
       ORDER BY ue.updated_at DESC`,
      [userId],
    )

    response.json({ enrollments: result.rows })
  } catch (error) {
    next(error)
  }
}

// 5. Log a completed workout session (guided or self-paced)
export async function logWorkout(request, response, next) {
  const userId = request.user.id
  const body = request.body || {}
  const title = typeof body.title === 'string' ? body.title.trim() : 'Workout Session'
  const durationSeconds = Math.max(1, Number(body.duration_seconds) || 60)
  const caloriesBurned = Math.max(0, Number(body.calories_burned) || Math.round((durationSeconds / 60) * 8.5))
  const programId = Number(body.program_id) || null
  const sessionId = Number(body.session_id) || null

  try {
    const logRes = await query(
      `INSERT INTO workout_logs (user_id, program_id, session_id, title, duration_seconds, calories_burned)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, program_id, session_id, title, duration_seconds, calories_burned, completed_at`,
      [userId, programId, sessionId, title, durationSeconds, caloriesBurned],
    )

    let nextDay = null
    // If completed as part of an enrolled program, advance current_day
    if (programId) {
      const enrollRes = await query(
        `UPDATE user_enrollments
         SET current_day = current_day + 1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND program_id = $2 AND status = 'active'
         RETURNING current_day`,
        [userId, programId],
      )
      if (enrollRes.rowCount > 0) {
        nextDay = enrollRes.rows[0].current_day
      }
    }

    // Proactive Alert: Congratulate and encourage streak
    await query(
      `INSERT INTO user_alerts (user_id, type, title, message)
       VALUES ($1, 'workout_completed', $2, $3)`,
      [
        userId,
        `Workout Completed: ${title}!`,
        `Great job logging ${Math.round(durationSeconds / 60)} minutes and ~${caloriesBurned} kcal. Your training streak has been updated!`,
      ],
    )

    response.status(201).json({
      message: 'Workout logged successfully.',
      workoutLog: logRes.rows[0],
      nextDay,
    })
  } catch (error) {
    next(error)
  }
}

// 6. Get member training stats, streak calculations, and activity calendar
export async function getStats(request, response, next) {
  const userId = request.user.id

  try {
    const aggResult = await query(
      `SELECT
         COUNT(*)::integer AS total_workouts,
         COALESCE(SUM(duration_seconds), 0)::integer AS total_seconds,
         COALESCE(SUM(calories_burned), 0)::integer AS total_calories
       FROM workout_logs
       WHERE user_id = $1`,
      [userId],
    )

    const totalWorkouts = aggResult.rows[0].total_workouts
    const totalMinutes = Math.round(aggResult.rows[0].total_seconds / 60)
    const totalCalories = aggResult.rows[0].total_calories

    // Calculate daily streaks using distinct workout dates
    const dateResult = await query(
      `SELECT DISTINCT TO_CHAR(completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day
       FROM workout_logs
       WHERE user_id = $1
       ORDER BY day DESC
       LIMIT 90`,
      [userId],
    )

    const daysSet = new Set(dateResult.rows.map((r) => r.day))
    const today = new Date().toISOString().slice(0, 10)
    const yesterdayDate = new Date(Date.now() - 86400000)
    const yesterday = yesterdayDate.toISOString().slice(0, 10)

    let currentStreak = 0
    let checkDate = new Date()

    // If worked out today, streak starts from today; if not worked out yet today but yesterday was done, streak is active
    if (!daysSet.has(today) && daysSet.has(yesterday)) {
      checkDate = yesterdayDate
    }

    while (true) {
      const dateStr = checkDate.toISOString().slice(0, 10)
      if (daysSet.has(dateStr)) {
        currentStreak++
        checkDate = new Date(checkDate.getTime() - 86400000)
      } else {
        break
      }
    }

    // Muscle category distribution
    const muscleResult = await query(
      `SELECT COALESCE(p.category, 'general') AS category, COUNT(*)::integer AS count
       FROM workout_logs wl
       LEFT JOIN training_programs p ON p.id = wl.program_id
       WHERE wl.user_id = $1
       GROUP BY COALESCE(p.category, 'general')`,
      [userId],
    )

    response.json({
      stats: {
        totalWorkouts,
        totalMinutes,
        totalCalories,
        currentStreak,
        activeDays: Array.from(daysSet),
        categoryDistribution: muscleResult.rows,
      },
    })
  } catch (error) {
    next(error)
  }
}

// 7. Get user activity alerts and reminders
export async function getAlerts(request, response, next) {
  const userId = request.user.id

  try {
    const result = await query(
      `SELECT id, type, title, message, action_url, is_read, scheduled_for, created_at
       FROM user_alerts
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 15`,
      [userId],
    )

    // If no alerts exist yet, seed a motivational welcome alert
    if (result.rowCount === 0) {
      const defaultAlert = await query(
        `INSERT INTO user_alerts (user_id, type, title, message)
         VALUES ($1, 'welcome', 'Welcome to NRBFIT Member Portal!', 'Explore home workout programs, book studio slots, and track your daily consistency.')
         RETURNING id, type, title, message, action_url, is_read, scheduled_for, created_at`,
        [userId],
      )
      response.json({ alerts: defaultAlert.rows })
      return
    }

    response.json({ alerts: result.rows })
  } catch (error) {
    next(error)
  }
}

// 8. Mark alert as read/dismissed
export async function markAlertRead(request, response, next) {
  const userId = request.user.id
  const { id } = request.params

  try {
    if (id === 'all') {
      await query('UPDATE user_alerts SET is_read = TRUE WHERE user_id = $1', [userId])
    } else {
      await query('UPDATE user_alerts SET is_read = TRUE WHERE id = $1 AND user_id = $2', [
        Number(id),
        userId,
      ])
    }

    response.json({ success: true })
  } catch (error) {
    next(error)
  }
}
