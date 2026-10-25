import { Router } from 'express'
import { cancelBooking, createBooking, getMyBookings } from '../controllers/bookingController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/my', requireAuth, getMyBookings)
router.post('/', requireAuth, createBooking)
router.delete('/:id', requireAuth, cancelBooking)

export default router