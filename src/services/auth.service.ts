import { prisma } from '~/config/database'
import { env } from '~/config/env'
import { BadRequestError, ConflictError, NotFoundRequestError } from '~/core/error.response'
import { UserRole, UserStatus } from '~/enums/user.enum'
import { hashData, compareHash, signAccessToken, signRefreshToken, signEmailVerifyToken, signResetPasswordToken, verifyToken } from '~/utils/jwt'
import { unGetData } from '~/utils/helpers'
import { emailService } from './email.service'
import { RegisterDto } from '~/dtos/auth'

export class AuthService {
  // UC1: Sign Up
  async register(dto: RegisterDto) {
    const existingEmail = await prisma.user.findUnique({ where: { email: dto.email } })
    if (existingEmail) throw new ConflictError('Email already exists')

    const existingPhone = await prisma.user.findFirst({ where: { phone: dto.phone } })
    if (existingPhone) throw new ConflictError('Phone number already exists')

    const passwordHash = await hashData(dto.password)
    const user = await prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        role: dto.role === 'LANDLORD' ? UserRole.LANDLORD : UserRole.TENANT,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    })

    // Tự động đăng nhập sau khi đăng ký
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(user.id),
      signRefreshToken(user.id),
    ])

    return {
      message: 'Đăng ký thành công!',
      user: unGetData({ fields: ['passwordHash', 'deletedAt'], object: user }),
      accessToken,
      refreshToken,
    }
  }

  // Verify email
  async verifyEmail(token: string) {
    let decoded: any
    try {
      decoded = verifyToken(token, env.JWT_VERIFY_EMAIL_SECRET)
    } catch {
      throw new BadRequestError('Invalid or expired verification token')
    }

    const verification = await prisma.emailVerification.findFirst({
      where: { token, usedAt: null },
    })
    if (!verification) throw new BadRequestError('Token already used or not found')
    if (verification.expiresAt < new Date()) throw new BadRequestError('Verification token has expired')

    await prisma.$transaction([
      prisma.user.update({
        where: { id: decoded.userId },
        data: { status: UserStatus.ACTIVE, emailVerified: true },
      }),
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      }),
    ])

    return { message: 'Email verified successfully. You can now sign in.' }
  }

  // UC2: Sign In
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new BadRequestError('Invalid email or password')
    if (user.deletedAt) throw new BadRequestError('Account not found')
    if (user.status === UserStatus.BANNED) throw new BadRequestError('Your account has been banned')
    // Tự động kích hoạt tài khoản nếu chưa verify (bỏ bắt buộc verify email)
    if (user.status === UserStatus.INACTIVE) {
      await prisma.user.update({ where: { id: user.id }, data: { status: UserStatus.ACTIVE, emailVerified: true } })
    }

    const isValid = await compareHash(password, user.passwordHash)
    if (!isValid) throw new BadRequestError('Invalid email or password')

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(user.id),
      signRefreshToken(user.id),
    ])

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } })

    return {
      user: unGetData({ fields: ['passwordHash', 'deletedAt'], object: user }),
      accessToken,
      refreshToken,
    }
  }

  // Refresh token
  async refreshToken(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.deletedAt) throw new BadRequestError('User not found')
    if (user.status === UserStatus.BANNED) throw new BadRequestError('Account banned')

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(user.id),
      signRefreshToken(user.id),
    ])
    return { accessToken, refreshToken }
  }

  // UC3: Forgot Password - Step 1: Send reset email
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    // Always return success to prevent email enumeration
    if (!user || user.deletedAt) {
      return { message: 'If this email is registered, you will receive a password reset link.' }
    }

    const resetToken = signResetPasswordToken(user.id)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes (ASR-7)

    await prisma.passwordReset.create({
      data: { userId: user.id, token: resetToken, expiresAt },
    })

    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`
    emailService.sendResetPasswordEmail(user.email, user.fullName, resetLink)
      .catch(err => console.warn('[Email] sendResetPasswordEmail failed:', err.message))

    return { message: 'If this email is registered, you will receive a password reset link.' }
  }

  // UC3: Forgot Password - Step 2: Reset password
  async resetPassword(token: string, newPassword: string) {
    let decoded: any
    try {
      decoded = verifyToken(token, env.JWT_RESET_PASSWORD_SECRET)
    } catch {
      throw new BadRequestError('Invalid or expired reset token')
    }

    const resetRecord = await prisma.passwordReset.findFirst({
      where: { token, usedAt: null },
    })
    if (!resetRecord) throw new BadRequestError('Token already used or not found')
    if (resetRecord.expiresAt < new Date()) throw new BadRequestError('Reset token has expired')

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user) throw new NotFoundRequestError('User not found')

    const isSamePassword = await compareHash(newPassword, user.passwordHash)
    if (isSamePassword) throw new BadRequestError('New password must be different from current password')

    const passwordHash = await hashData(newPassword)

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      prisma.passwordReset.update({ where: { id: resetRecord.id }, data: { usedAt: new Date() } }),
    ])

    return { message: 'Password reset successfully. Please sign in with your new password.' }
  }

  // Get current user profile
  async getMe(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        avatar: true,
        createdAt: true,
        lastLogin: true,
      },
    })
    if (!user) throw new NotFoundRequestError('User not found')
    return user
  }
}

export const authService = new AuthService()
