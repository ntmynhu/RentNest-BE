import { Router } from 'express'
import { reportController } from '~/controllers/report.controller'
import { authenticate, requireRole } from '~/middlewares/auth.middleware'
import { validateDto } from '~/middlewares/dtoValidation.middleware'
import { wrapRequestHandler } from '~/utils/handler'
import { CreateReportDto } from '~/dtos/report'
import { UserRole } from '~/enums/user.enum'

const router = Router()

// UC12: Any authenticated user can report
router.post('/',
  authenticate,
  validateDto(CreateReportDto),
  wrapRequestHandler(reportController.create)
)

// Admin only
router.get('/',         authenticate, requireRole(UserRole.ADMIN), wrapRequestHandler(reportController.getAll))
router.patch('/:id',    authenticate, requireRole(UserRole.ADMIN), wrapRequestHandler(reportController.resolve))

export default router
