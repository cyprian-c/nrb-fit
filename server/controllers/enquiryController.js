import { query } from '../config/db.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Validate and persist a public studio enquiry without exposing database details.
export async function createEnquiry(request, response, next) {
  const body = request.body || {}
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const interest = typeof body.interest === 'string' ? body.interest.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!name || !email || !interest || !message) {
    response.status(400).json({ error: 'Name, email, interest, and message are required.' })
    return
  }

  if (!emailPattern.test(email)) {
    response.status(400).json({ error: 'Please provide a valid email address.' })
    return
  }

  if (name.length > 120 || email.length > 255 || interest.length > 100) {
    response.status(400).json({ error: 'One or more enquiry fields are too long.' })
    return
  }

  try {
    const result = await query(
      `INSERT INTO enquiries (name, email, interest, message, status)
       VALUES ($1, $2, $3, $4, 'new')
       RETURNING id`,
      [name, email, interest, message],
    )

    response.status(201).json({
      message: 'Enquiry received successfully.',
      enquiryId: result.rows[0].id,
    })
  } catch (error) {
    next(error)
  }
}