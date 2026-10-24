import { Router } from 'express'
import { signup } from '../controllers/authController.js'

const router = Router()

// Account creation is public; later auth phases add login and session routes.
router.post('/signup', signup)

export default router