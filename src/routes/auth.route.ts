import { Router } from 'express'
import { authController } from '~/controllers/auth.controller'
import { authenticate, refreshTokenValidation } from '~/middlewares/auth.middleware'
import { validateDto } from '~/middlewares/dtoValidation.middleware'
import { wrapRequestHandler } from '~/utils/handler'
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from '~/dtos/auth'

const router = Router()

router.post('/register',    validateDto(RegisterDto),       wrapRequestHandler(authController.register))
router.get('/verify-email',                                 wrapRequestHandler(authController.verifyEmail))
router.post('/login',       validateDto(LoginDto),          wrapRequestHandler(authController.login))
router.post('/logout',      authenticate,                   wrapRequestHandler(authController.logout))
router.post('/refresh-token', refreshTokenValidation,       wrapRequestHandler(authController.refreshToken))
router.post('/forgot-password', validateDto(ForgotPasswordDto), wrapRequestHandler(authController.forgotPassword))
router.post('/reset-password',  validateDto(ResetPasswordDto),  wrapRequestHandler(authController.resetPassword))
router.get('/me',           authenticate,                   wrapRequestHandler(authController.getMe))

export default router
