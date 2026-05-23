import { Router } from 'express'
import { reviewController } from '~/controllers/review.controller'
import { authenticate, requireRole } from '~/middlewares/auth.middleware'
import { validateDto } from '~/middlewares/dtoValidation.middleware'
import { wrapRequestHandler } from '~/utils/handler'
import { CreateReviewDto } from '~/dtos/review'
import { UserRole } from '~/enums/user.enum'

const router = Router()

// Public: view reviews for a listing
router.get('/listing/:listingId', wrapRequestHandler(reviewController.getByListing))

// Tenant only (UC11)
router.post('/listing/:listingId',
  authenticate,
  requireRole(UserRole.TENANT),
  validateDto(CreateReviewDto),
  wrapRequestHandler(reviewController.create)
)

export default router
