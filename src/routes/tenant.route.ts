import { Router } from 'express'
import { tenantController } from '~/controllers/tenant.controller'
import { authenticate, requireRole } from '~/middlewares/auth.middleware'
import { validateDto } from '~/middlewares/dtoValidation.middleware'
import { wrapRequestHandler } from '~/utils/handler'
import { CreateTenantDto, UpdateTenantDto } from '~/dtos/tenant'
import { UserRole } from '~/enums/user.enum'

const router = Router()

router.use(authenticate, requireRole(UserRole.LANDLORD))

router.post('/',     validateDto(CreateTenantDto), wrapRequestHandler(tenantController.create))
router.get('/',                                    wrapRequestHandler(tenantController.getAll))
router.get('/:id',                                 wrapRequestHandler(tenantController.getById))
router.put('/:id',   validateDto(UpdateTenantDto), wrapRequestHandler(tenantController.update))
router.delete('/:id',                              wrapRequestHandler(tenantController.remove))

export default router
