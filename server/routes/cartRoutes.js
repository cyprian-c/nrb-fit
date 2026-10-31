import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { createRateLimiter } from '../middleware/rateLimiter.js'
import {
  getServices,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartForCheckout
} from '../controllers/cartController.js'

const router = Router()

// Rate limiter for cart operations
const cartLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many cart requests. Please wait before trying again.',
})

// Public endpoint - get all available services
router.get('/services', getServices)

// Protected routes - require authentication
router.get('/', requireAuth, getCart)
router.post('/', requireAuth, cartLimiter, addToCart)
router.get('/checkout', requireAuth, getCartForCheckout)
router.put('/:id', requireAuth, updateCartItem)
router.delete('/:id', requireAuth, removeFromCart)
router.delete('/', requireAuth, clearCart)

export default router