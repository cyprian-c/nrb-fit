// Convert unexpected route failures into one consistent JSON response so the
// client never has to parse Express's default HTML error page.
export function errorHandler(error, request, response, next) {
  const statusCode = error.statusCode || 500
  const message = statusCode === 500 ? 'Internal server error.' : error.message

  console.error('[server] Request failed:', error)
  response.status(statusCode).json({ error: message })
}