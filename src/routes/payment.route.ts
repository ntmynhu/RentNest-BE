import { Router } from 'express'
import { paymentController } from '~/controllers/payment.controller'
import { authenticate, requireRole } from '~/middlewares/auth.middleware'
import { validateDto } from '~/middlewares/dtoValidation.middleware'
import { wrapRequestHandler } from '~/utils/handler'
import { CreatePaymentDto, MarkPaidDto } from '~/dtos/payment'
import { UserRole } from '~/enums/user.enum'

const router = Router()

router.use(authenticate)

// Both Tenant and Landlord can view payments (UC10)
router.get('/',                                              wrapRequestHandler(paymentController.getAll))
router.patch('/:id/paid',  requireRole(UserRole.LANDLORD),  validateDto(MarkPaidDto), wrapRequestHandler(paymentController.markAsPaid))

// Only Landlord can create payment records
router.post('/',           requireRole(UserRole.LANDLORD),  validateDto(CreatePaymentDto), wrapRequestHandler(paymentController.create))

export default router
