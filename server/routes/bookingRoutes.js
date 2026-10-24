import { Router } from 'express'
import { createBooking } from '../controllers/bookingController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/', requireAuth, createBooking)

export default router