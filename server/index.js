import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import authRoutes from './routes/authRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import classRoutes from './routes/classRoutes.js'
import coachRoutes from './routes/coachRoutes.js'
import enquiryRoutes from './routes/enquiryRoutes.js'
import membershipRoutes from './routes/membershipRoutes.js'
import portalRoutes from './routes/portalRoutes.js'
import { errorHandler } from './middleware/errorHandler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Robustly load environment variables across local dev, cPanel app root, and custom paths.
dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config({ path: path.resolve(__dirname, '.env') })
if (process.env.DOTENV_CONFIG_PATH) {
  dotenv.config({ path: process.env.DOTENV_CONFIG_PATH })
}
dotenv.config()

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = process.env.NODE_ENV === 'production'
    ? 'nrbfit_jwt_production_fallback_secret_change_in_env'
    : 'nrbfit_jwt_session_secret_development_fallback_key'
}

if (typeof PhusionPassenger !== 'undefined') {
  PhusionPassenger.configure({ autoInstall: false })
}

const app = express()
const rawPort = process.env.PORT || (typeof PhusionPassenger !== 'undefined' ? 'passenger' : 5000)
const port = isNaN(Number(rawPort)) ? rawPort : Number(rawPort)
const configuredOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean)

const defaultOrigins = [
  'http://localhost:5173',
  'https://nrbfit.vercel.app',
  'https://nrbfit.cyprian.services',
  'http://nrbfit.cyprian.services',
  'https://nrfit.cyprian.services',
  'http://nrfit.cyprian.services',
]
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]))

// Allow the browser client to send JSON requests and session cookies while
// still keeping the allowed frontend origin explicit for cross-origin calls.
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    const normalizedOrigin = origin.replace(/\/+$/, '')
    const isAllowed =
      allowedOrigins.includes(normalizedOrigin) ||
      /^https:\/\/nrbfit.*\.vercel\.app$/.test(normalizedOrigin) ||
      /^https?:\/\/nrb?fit\.cyprian\.services$/.test(normalizedOrigin) ||
      /^http:\/\/localhost(:\d+)?$/.test(normalizedOrigin)

    if (isAllowed) {
      callback(null, true)
      return
    }

    callback(new Error(`The request origin ${origin} is not allowed by the API.`))
  },
  credentials: true,
}))
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf
  },
}))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// A lightweight endpoint for deployment checks and uptime monitors. It does
// not query the database, so infrastructure can verify the process separately.
app.get('/api/health', (request, response) => {
  response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// Public studio data routes are mounted before the final error handler.
app.use('/api/auth', authRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/classes', classRoutes)
app.use('/api/coaches', coachRoutes)
app.use('/api/memberships', membershipRoutes)
app.use('/api/enquiries', enquiryRoutes)
app.use('/api/portal', portalRoutes)

// Serve frontend client dist in production if available (workspace build or public dir)
const distCandidates = [
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(__dirname, 'public'),
]
const clientDistPath = distCandidates.find((dir) => fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.html')))

if (clientDistPath) {
  app.use(
    express.static(clientDistPath, {
      maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache')
        }
      },
    }),
  )
  // Fallback for client-side SPA routing (all GET requests that are not /api and did not match a static file)
  app.get('*', (request, response, next) => {
    if (request.path.startsWith('/api')) {
      return next()
    }
    response.setHeader('Cache-Control', 'no-cache')
    response.sendFile(path.join(clientDistPath, 'index.html'))
  })
}

// Keep error handling last so it receives failures from every route above.
app.use(errorHandler)

// Prevent uncaught errors from silently terminating Passenger without diagnostics
process.on('uncaughtException', (error) => {
  console.error('[server] Uncaught Exception:', error)
})
process.on('unhandledRejection', (reason, promise) => {
  console.error('[server] Unhandled Rejection at:', promise, 'reason:', reason)
})

const server = app.listen(port, () => {
  console.info(`[server] NRBFIT API listening on ${port}`)
})

server.on('error', (error) => {
  console.error('[server] Server listen error:', error)
})

export { app }