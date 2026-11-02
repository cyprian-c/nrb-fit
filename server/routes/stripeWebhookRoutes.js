import { Router } from 'express'
import { handleStripeWebhook } from '../controllers/checkoutController.js'
import { verifyStripeWebhook } from '../middleware/stripeWebhook.js'

const router = Router()

router.post('/', verifyStripeWebhook, handleStripeWebhook)

export default router