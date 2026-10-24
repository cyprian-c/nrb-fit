import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import authRoutes from './routes/authRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import classRoutes from './routes/classRoutes.js'
import coachRoutes from './routes/coachRoutes.js'
import enquiryRoutes from './routes/enquiryRoutes.js'
import membershipRoutes from './routes/membershipRoutes.js'
import { errorHandler } from './middleware/errorHandler.js'

// In local development the workspace keeps its real .env at the repository
// root. Deployed environments already expose process variables directly.
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '../.env' })

const app = express()
const port = Number(process.env.PORT) || 5000
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

// Allow the browser client to send JSON requests and session cookies while
// still keeping the allowed frontend origin explicit for cross-origin calls.
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('The request origin is not allowed by the API.'))
  },
  credentials: true,
}))
app.use(express.json())
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

// Keep error handling last so it receives failures from every route above.
app.use(errorHandler)

app.listen(port, '0.0.0.0', () => {
  console.info(`[server] NRBFIT API listening on port ${port}`)
})

export { app }