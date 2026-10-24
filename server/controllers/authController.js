import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../config/db.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const sessionCookieName = 'nrb_session'
const sessionDuration = 7 * 24 * 60 * 60 * 1000

function setSessionCookie(response, token) {
  response.cookie(sessionCookieName, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: sessionDuration,
  })
}

// Register a member, create a server-side password hash, and start a session.
export async function signup(request, response, next) {
  const body = request.body || {}
  const fullNameValue = body.full_name ?? body.fullName
  const fullName = typeof fullNameValue === 'string' ? fullNameValue.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!fullName || !email || !password) {
    response.status(400).json({ error: 'Full name, email, and password are required.' })
    return
  }

  if (fullName.length > 120) {
    response.status(400).json({ error: 'Full name must be 120 characters or fewer.' })
    return
  }

  if (!emailPattern.test(email) || email.length > 255) {
    response.status(400).json({ error: 'Please provide a valid email address.' })
    return
  }

  if (password.length < 6) {
    response.status(400).json({ error: 'Password must be at least 6 characters long.' })
    return
  }

  if (!process.env.JWT_SECRET) {
    next(new Error('JWT_SECRET must be configured before creating sessions.'))
    return
  }

  try {
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [email],
    )

    if (existingUser.rowCount > 0) {
      response.status(400).json({ error: 'An account with that email already exists.' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const result = await query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'member')
       RETURNING id, full_name, email, role`,
      [fullName, email, passwordHash],
    )
    const user = result.rows[0]
    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    setSessionCookie(response, token)
    response.status(201).json({ user })
  } catch (error) {
    if (error.code === '23505') {
      response.status(400).json({ error: 'An account with that email already exists.' })
      return
    }

    next(error)
  }
}