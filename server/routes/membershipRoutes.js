import { Router } from 'express'
import { getMemberships } from '../controllers/membershipController.js'

const router = Router()

// Public pricing endpoint for membership and class-pack details.
router.get('/', getMemberships)

export default router