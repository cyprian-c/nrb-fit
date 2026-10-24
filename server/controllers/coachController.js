import { query } from '../config/db.js'

// Return the public coach roster in a stable display order.
export async function getCoaches(request, response, next) {
  try {
    const result = await query(
      `SELECT id, name, specialty, bio, image_url
       FROM coaches
       ORDER BY id ASC`,
    )

    response.json({ coaches: result.rows })
  } catch (error) {
    next(error)
  }
}