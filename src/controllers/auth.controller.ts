import { Request, Response } from 'express'
import { authService } from '~/services/auth.service'
import { SuccessResponse, CreatedResponse } from '~/core/success.response'

const isProd = process.env.NODE_ENV === 'production'
const cookieOpts = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ('none' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

class AuthController {
  // POST /api/auth/register  (UC1: Sign Up)
  register = async (req: Request, res: Response) => {
    const result = await authService.register(req.body)
    return new CreatedResponse({ message: result.message }).send(res)
  }

  // GET /api/auth/verify-email?token=...
  verifyEmail = async (req: Request, res: Response) => {
    const { token } = req.query as { token: string }
    const result = await authService.verifyEmail(token)
    return new SuccessResponse({ message: result.message }).send(res)
  }

  // POST /api/auth/login  (UC2: Sign In)
  login = async (req: Request, res: Response) => {
    const { email, password } = req.body
    const result = await authService.login(email, password)
    res.cookie('refreshToken', result.refreshToken, cookieOpts)
    return new SuccessResponse({
      message: 'Login successfully',
      metaData: { user: result.user, accessToken: result.accessToken },
    }).send(res)
  }

  // POST /api/auth/logout
  logout = async (req: Request, res: Response) => {
    res.clearCookie('refreshToken', { httpOnly: true, secure: isProd, sameSite: 'strict' })
    return new SuccessResponse({ message: 'Logged out successfully' }).send(res)
  }

  // POST /api/auth/refresh-token
  refreshToken = async (req: Request, res: Response) => {
    const userId = req.decodedToken!.userId
    const result = await authService.refreshToken(userId)
    res.cookie('refreshToken', result.refreshToken, cookieOpts)
    return new SuccessResponse({
      message: 'Token refreshed',
      metaData: { accessToken: result.accessToken },
    }).send(res)
  }

  // POST /api/auth/forgot-password  (UC3: Step 1)
  forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body
    const result = await authService.forgotPassword(email)
    return new SuccessResponse({ message: result.message }).send(res)
  }

  // POST /api/auth/reset-password  (UC3: Step 2)
  resetPassword = async (req: Request, res: Response) => {
    const { token, newPassword } = req.body
    const result = await authService.resetPassword(token, newPassword)
    return new SuccessResponse({ message: result.message }).send(res)
  }

  // GET /api/auth/me
  getMe = async (req: Request, res: Response) => {
    const result = await authService.getMe(req.user!.id)
    return new SuccessResponse({ message: 'Profile retrieved', metaData: result }).send(res)
  }
}

export const authController = new AuthController()
