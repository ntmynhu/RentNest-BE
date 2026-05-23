import { Router } from 'express'
import { userController } from '~/controllers/user.controller'
import { authenticate, requireRole } from '~/middlewares/auth.middleware'
import { validateDto } from '~/middlewares/dtoValidation.middleware'
import { wrapRequestHandler } from '~/utils/handler'
import { BanUserDto, WarnUserDto } from '~/dtos/user'
import { UserRole } from '~/enums/user.enum'

const router = Router()

router.use(authenticate, requireRole(UserRole.ADMIN))

router.get('/',                           wrapRequestHandler(userController.getAll))
router.get('/:id',                        wrapRequestHandler(userController.getById))
router.post('/:id/warn',  validateDto(WarnUserDto), wrapRequestHandler(userController.warn))
router.post('/:id/ban',   validateDto(BanUserDto),  wrapRequestHandler(userController.ban))

export default router
