import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { getOrders, getOrderById } from '../controllers/orderController.js'

const router = Router()

// All order endpoints require JWT authentication
router.use(requireAuth)

router.get('/', getOrders)
router.get('/:id', getOrderById)

export default router
