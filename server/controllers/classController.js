import { query } from '../config/db.js'

// Return the timetable with coach details so the public schedule can render
// one complete record without making a second request for each class.
export async function getClasses(request, response, next) {
  const requestedCategory = request.query.category
  const category = typeof requestedCategory === 'string' && requestedCategory.trim()
    ? requestedCategory.trim()
    : null

  try {
    const result = await query(
      `SELECT
         classes.id,
         classes.time,
         classes.name,
         classes.category,
         classes.focus,
         classes.duration,
         coaches.name AS coach_name,
         coaches.specialty AS coach_specialty
       FROM classes
       LEFT JOIN coaches ON coaches.id = classes.coach_id
       WHERE ($1::varchar IS NULL OR classes.category = $1)
       ORDER BY classes.time ASC`,
      [category],
    )

    response.json({ classes: result.rows })
  } catch (error) {
    next(error)
  }
}