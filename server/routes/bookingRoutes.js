import { Router } from 'express'
import { createBooking, getMyBookings } from '../controllers/bookingController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/my', requireAuth, getMyBookings)
router.post('/', requireAuth, createBooking)

export default router