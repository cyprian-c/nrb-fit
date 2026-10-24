import { query } from '../config/db.js'

// Return membership cards in ascending numeric price order for the pricing UI.
export async function getMemberships(request, response, next) {
  try {
    const result = await query(
      `SELECT id, label, title, price, suffix, description, perks, featured
       FROM memberships
       ORDER BY NULLIF(REGEXP_REPLACE(price, '[^0-9.]', '', 'g'), '')::numeric ASC,
                id ASC`,
    )

    response.json({ memberships: result.rows })
  } catch (error) {
    next(error)
  }
}