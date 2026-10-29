/**
 * In-memory sliding window rate limiter middleware.
 * Protects checkout session creation and sensitive payment endpoints against abuse.
 */
export function createRateLimiter({
  windowMs = 60 * 1000,
  max = 10,
  message = 'Too many checkout requests. Please wait a moment before trying again.',
} = {}) {
  const requests = new Map()

  return function rateLimiter(req, res, next) {
    const key = req.user?.id ? `user_${req.user.id}` : `ip_${req.ip || req.socket.remoteAddress}`
    const now = Date.now()

    let timestamps = requests.get(key)
    if (!timestamps) {
      timestamps = []
      requests.set(key, timestamps)
    }

    // Retain only requests within the sliding window
    const recent = timestamps.filter((time) => now - time < windowMs)
    recent.push(now)
    requests.set(key, recent)

    if (recent.length > max) {
      return res.status(429).json({ error: message })
    }

    // Cleanup periodically
    if (requests.size > 2000) {
      for (const [k, times] of requests.entries()) {
        const valid = times.filter((t) => now - t < windowMs)
        if (valid.length === 0) {
          requests.delete(k)
        } else {
          requests.set(k, valid)
        }
      }
    }

    next()
  }
}
