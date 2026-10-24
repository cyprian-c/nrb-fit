import { Router } from 'express'
import { getClasses } from '../controllers/classController.js'

const router = Router()

// Public timetable endpoint. Category filtering remains optional.
router.get('/', getClasses)

export default router