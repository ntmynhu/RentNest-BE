import { Router } from 'express'
import { contractController } from '~/controllers/contract.controller'
import { authenticate, requireRole } from '~/middlewares/auth.middleware'
import { validateDto } from '~/middlewares/dtoValidation.middleware'
import { wrapRequestHandler } from '~/utils/handler'
import { CreateContractDto, UpdateContractDto } from '~/dtos/contract'
import { UserRole } from '~/enums/user.enum'

const router = Router()

// Tenant: view own contracts (must be before the landlord middleware)
router.get('/mine',
  authenticate,
  requireRole(UserRole.TENANT),
  wrapRequestHandler(contractController.getMine)
)

// All routes below require LANDLORD role
router.use(authenticate, requireRole(UserRole.LANDLORD))

router.post('/',             validateDto(CreateContractDto), wrapRequestHandler(contractController.create))
router.get('/',                                              wrapRequestHandler(contractController.getAll))
router.get('/:id',                                          wrapRequestHandler(contractController.getById))
router.put('/:id',           validateDto(UpdateContractDto), wrapRequestHandler(contractController.update))
router.patch('/:id/activate',                                wrapRequestHandler(contractController.activate))
router.patch('/:id/archive',                                 wrapRequestHandler(contractController.archive))

export default router
