import { Router } from 'express'
import {
  enrollProgram,
  getAlerts,
  getMyEnrollments,
  getProgramBySlug,
  getPrograms,
  getStats,
  logWorkout,
  markAlertRead,
} from '../controllers/portalController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

// Public training program catalog previews
router.get('/programs', getPrograms)
router.get('/programs/:slug', getProgramBySlug)

// Member-protected portal features
router.post('/enroll', requireAuth, enrollProgram)
router.get('/my-enrollments', requireAuth, getMyEnrollments)
router.post('/log-workout', requireAuth, logWorkout)
router.get('/stats', requireAuth, getStats)
router.get('/alerts', requireAuth, getAlerts)
router.post('/alerts/:id/read', requireAuth, markAlertRead)

export default router
