import { Router } from 'express'
import { createEnquiry } from '../controllers/enquiryController.js'

const router = Router()

// Public contact form submission endpoint.
router.post('/', createEnquiry)

export default router