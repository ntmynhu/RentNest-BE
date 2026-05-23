import { Request, Response, NextFunction } from 'express'
import { prisma } from '~/config/database'
import { AuthRequestError, ForbiddenRequestError } from '~/core/error.response'
import { verifyToken } from '~/utils/jwt'
import { env } from '~/config/env'
import { UserRole } from '~/enums/user.enum'

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthRequestError('Access token is required')
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token, env.JWT_ACCESS_SECRET)

    if (decoded.tokenType !== 'ACCESS_TOKEN') {
      throw new AuthRequestError('Invalid token type')
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user || user.deletedAt) {
      throw new AuthRequestError('User not found')
    }

    if (user.status === 'BANNED') {
      throw new AuthRequestError('Your account has been banned')
    }

    if (user.status === 'INACTIVE') {
      throw new AuthRequestError('Please verify your email to activate your account')
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as UserRole,
      status: user.status,
    }
    req.decodedToken = decoded
    next()
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(new AuthRequestError('Access token has expired'))
    } else if (error.name === 'JsonWebTokenError') {
      next(new AuthRequestError('Invalid access token'))
    } else {
      next(error)
    }
  }
}

export const refreshTokenValidation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken
    if (!refreshToken) throw new AuthRequestError('Refresh token is required')

    const decoded = verifyToken(refreshToken, env.JWT_REFRESH_SECRET)
    if (decoded.tokenType !== 'REFRESH_TOKEN') throw new AuthRequestError('Invalid token type')

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user || user.deletedAt) throw new AuthRequestError('User not found')

    req.decodedToken = decoded
    next()
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') next(new AuthRequestError('Refresh token has expired'))
    else if (error.name === 'JsonWebTokenError') next(new AuthRequestError('Invalid refresh token'))
    else next(error)
  }
}

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AuthRequestError('Not authenticated'))
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenRequestError(`Requires role: ${roles.join(' or ')}`))
    }
    next()
  }
}
