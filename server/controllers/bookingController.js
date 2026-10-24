import { query } from '../config/db.js'

const bookingCapacity = 20
const datePattern = /^\d{4}-\d{2}-\d{2}$/

function getBookingDate(value) {
  const bookingDate = value ?? new Date().toISOString().slice(0, 10)

  if (typeof bookingDate !== 'string' || !datePattern.test(bookingDate)) {
    return null
  }

  const parsedDate = new Date(`${bookingDate}T00:00:00.000Z`)
  return parsedDate.toISOString().slice(0, 10) === bookingDate ? bookingDate : null
}

export async function createBooking(request, response, next) {
  const classId = Number(request.body?.class_id)
  const bookingDate = getBookingDate(request.body?.booking_date)

  if (!Number.isInteger(classId) || classId < 1) {
    response.status(400).json({ error: 'A valid class_id is required.' })
    return
  }

  if (!bookingDate) {
    response.status(400).json({ error: 'booking_date must be a valid YYYY-MM-DD date.' })
    return
  }

  try {
    const classResult = await query(
      `SELECT id, time, name, category, focus, duration
       FROM classes
       WHERE id = $1
       LIMIT 1`,
      [classId],
    )

    if (classResult.rowCount === 0) {
      response.status(404).json({ error: 'Class not found.' })
      return
    }

    const duplicateResult = await query(
      `SELECT id
       FROM bookings
       WHERE user_id = $1 AND class_id = $2 AND booking_date = $3 AND status = 'confirmed'
       LIMIT 1`,
      [request.user.id, classId, bookingDate],
    )

    if (duplicateResult.rowCount > 0) {
      response.status(409).json({ error: 'You have already booked this class for that date.' })
      return
    }

    const capacityResult = await query(
      `SELECT COUNT(*)::integer AS confirmed_count
       FROM bookings
       WHERE class_id = $1 AND booking_date = $2 AND status = 'confirmed'`,
      [classId, bookingDate],
    )
    const confirmedCount = capacityResult.rows[0].confirmed_count

    if (confirmedCount >= bookingCapacity) {
      response.status(409).json({ error: 'This class is fully booked.' })
      return
    }

    const bookingResult = await query(
      `INSERT INTO bookings (user_id, class_id, booking_date, status)
       VALUES ($1, $2, $3, 'confirmed')
       RETURNING id, user_id, class_id, booking_date, status, created_at`,
      [request.user.id, classId, bookingDate],
    )

    response.status(201).json({
      booking: {
        ...bookingResult.rows[0],
        class: classResult.rows[0],
      },
    })
  } catch (error) {
    next(error)
  }
}