import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { createRateLimiter } from '../middleware/rateLimiter.js'
import { verifyStripeWebhook } from '../middleware/stripeWebhook.js'
import { createCheckoutSession, handleStripeWebhook } from '../controllers/checkoutController.js'

const router = Router()

// Rate limiter for checkout creations: 15 attempts per minute
const checkoutLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: 'Too many checkout requests. Please wait a moment before trying again.',
})

router.post('/create', requireAuth, checkoutLimiter, createCheckoutSession)
router.post('/webhook', verifyStripeWebhook, handleStripeWebhook)

export default router
