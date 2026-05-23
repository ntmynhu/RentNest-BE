import { prisma } from '~/config/database'
import { BadRequestError, NotFoundRequestError } from '~/core/error.response'
import { emailService } from './email.service'
import { getPaginationParams, buildPaginatedResponse } from '~/utils/helpers'

export class UserService {
  // UC15: Warn user
  async warnUser(adminId: number, userId: number, reason: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } })
    if (!user) throw new NotFoundRequestError('User not found')

    const warning = await prisma.warning.create({
      data: { userId, adminId, reason },
    })

    emailService.sendWarningEmail(user.email, user.fullName, reason)
      .catch(err => console.warn('[Email] sendWarningEmail failed:', err.message))

    return warning
  }

  // UC15: Ban user
  async banUser(adminId: number, userId: number, reason: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } })
    if (!user) throw new NotFoundRequestError('User not found')
    if (user.role === 'ADMIN') throw new BadRequestError('Cannot ban an admin account')

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: 'BANNED' },
    })

    // Archive landlord's listings if banned
    if (user.role === 'LANDLORD') {
      await prisma.listing.updateMany({
        where: { landlordId: userId, deletedAt: null },
        data: { status: 'ARCHIVED' },
      })
    }

    emailService.sendBanEmail(user.email, user.fullName, reason)
      .catch(err => console.warn('[Email] sendBanEmail failed:', err.message))

    return updated
  }

  // Admin: Get all users
  async getUsers(query: any) {
    const { page, limit, skip } = getPaginationParams(query)
    const where: any = { deletedAt: null }
    if (query.role) where.role = query.role
    if (query.status) where.status = query.status
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, fullName: true, phone: true,
          role: true, status: true, emailVerified: true,
          createdAt: true, lastLogin: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    return buildPaginatedResponse(users, total, page, limit)
  }

  async getUserById(userId: number) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true, email: true, fullName: true, phone: true,
        role: true, status: true, emailVerified: true, avatar: true,
        createdAt: true, lastLogin: true,
        warnings: { orderBy: { issuedAt: 'desc' } },
        _count: { select: { listings: true, reviews: true } },
      },
    })
    if (!user) throw new NotFoundRequestError('User not found')
    return user
  }
}

export const userService = new UserService()
