import jwt from 'jsonwebtoken'

const sessionCookieName = 'nrb_session'

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

export function requireAuth(request, response, next) {
  const token = getSessionToken(request)

  if (!token || !process.env.JWT_SECRET) {
    response.status(401).json({ error: 'Authentication required.' })
    return
  }

  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      response.status(401).json({ error: 'Session is invalid or expired.' })
      return
    }

    next(error)
  }
}

export function requireAdmin(request, response, next) {
  if (request.user?.role !== 'admin') {
    response.status(403).json({ error: 'Administrator access required.' })
    return
  }

  next()
}