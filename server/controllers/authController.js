import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../config/db.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const sessionCookieName = 'nrb_session'
const sessionDuration = 7 * 24 * 60 * 60 * 1000
const isProduction = process.env.NODE_ENV === 'production'

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: sessionDuration,
  }
}

function setSessionCookie(response, token) {
  response.cookie(sessionCookieName, token, getCookieOptions())
}

function getSessionToken(request) {
  if (request.cookies?.[sessionCookieName]) {
    return request.cookies[sessionCookieName]
  }

  const authorization = request.get('authorization')
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim()
  }

  return null
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

// Verify member credentials and replace any existing session with a fresh token.
export async function login(request, response, next) {
  const body = request.body || {}
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    response.status(400).json({ error: 'Email and password are required.' })
    return
  }

  if (!process.env.JWT_SECRET) {
    next(new Error('JWT_SECRET must be configured before creating sessions.'))
    return
  }

  try {
    const result = await query(
      `SELECT id, full_name, email, role, password_hash
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email],
    )
    const user = result.rows[0]
    const passwordMatches = user
      ? await bcrypt.compare(password, user.password_hash)
      : false

    if (!user || !passwordMatches) {
      response.status(401).json({ error: 'Invalid email or password.' })
      return
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    setSessionCookie(response, token)
    response.json({
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Restore the current session from the cookie or an Authorization bearer token.
export async function getCurrentUser(request, response, next) {
  const token = getSessionToken(request)

  if (!token || !process.env.JWT_SECRET) {
    response.status(401).json({ error: 'Authentication required.' })
    return
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const result = await query(
      `SELECT id, full_name, email, role
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [payload.id],
    )
    const user = result.rows[0]

    if (!user) {
      response.status(401).json({ error: 'Session is no longer valid.' })
      return
    }

    response.json({ user })
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      response.status(401).json({ error: 'Session is invalid or expired.' })
      return
    }

    next(error)
  }
}

// Remove the browser session without requiring a valid token first.
export function logout(request, response) {
  const options = getCookieOptions()
  delete options.maxAge
  response.clearCookie(sessionCookieName, options)
  response.json({ message: 'Logged out successfully' })
}