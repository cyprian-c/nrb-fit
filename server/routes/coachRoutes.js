import { Router } from 'express'
import { getCoaches } from '../controllers/coachController.js'

const router = Router()

// Public roster endpoint for the studio's coach profiles.
router.get('/', getCoaches)

export default router