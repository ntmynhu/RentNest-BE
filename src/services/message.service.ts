import { prisma } from '~/config/database'
import { BadRequestError, ForbiddenRequestError, NotFoundRequestError } from '~/core/error.response'
import { UserRole } from '~/enums/user.enum'
import { SendMessageDto } from '~/dtos/message'

export class MessageService {
  // UC6: Contact Landlord - Tenant sends message
  async sendMessageToLandlord(tenantId: number, landlordId: number, dto: SendMessageDto) {
    const landlord = await prisma.user.findFirst({
      where: { id: landlordId, role: 'LANDLORD', deletedAt: null },
    })
    if (!landlord) throw new NotFoundRequestError('Landlord not found')

    if (dto.listingId) {
      const listing = await prisma.listing.findFirst({
        where: { id: dto.listingId, landlordId, deletedAt: null },
      })
      if (!listing) throw new NotFoundRequestError('Listing not found')
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { tenantId, landlordId, listingId: dto.listingId || null },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { tenantId, landlordId, listingId: dto.listingId, status: 'ACTIVE' },
      })
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        fromUserId: tenantId,
        content: dto.content,
        isRead: false,
        status: 'SENT',
      },
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    })

    return { conversation, message }
  }

  // UC14: Contact Tenant - Landlord sends message
  async sendMessageToTenant(landlordId: number, tenantUserId: number, dto: SendMessageDto) {
    const tenant = await prisma.user.findFirst({
      where: { id: tenantUserId, deletedAt: null },
    })
    if (!tenant) throw new NotFoundRequestError('Tenant not found')

    // Verify landlord has this tenant
    const tenantRecord = await prisma.tenant.findFirst({
      where: { userId: tenantUserId, landlordId },
    })
    if (!tenantRecord) throw new ForbiddenRequestError('This user is not your tenant')

    let conversation = await prisma.conversation.findFirst({
      where: { tenantId: tenantUserId, landlordId },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { tenantId: tenantUserId, landlordId, status: 'ACTIVE' },
      })
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        fromUserId: landlordId,
        content: dto.content,
        isRead: false,
        status: 'SENT',
      },
    })

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    })

    return { conversation, message }
  }

  // Get user's conversations
  async getConversations(userId: number, role: UserRole) {
    const where = role === UserRole.LANDLORD ? { landlordId: userId } : { tenantId: userId }

    return prisma.conversation.findMany({
      where: { ...where, status: 'ACTIVE' },
      include: {
        tenant: { select: { id: true, fullName: true, avatar: true } },
        landlord: { select: { id: true, fullName: true, avatar: true } },
        listing: { select: { id: true, title: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  // Get conversation messages
  async getMessages(userId: number, conversationId: number) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ tenantId: userId }, { landlordId: userId }],
      },
    })
    if (!conversation) throw new NotFoundRequestError('Conversation not found')

    // Mark messages as read
    await prisma.message.updateMany({
      where: { conversationId, fromUserId: { not: userId }, isRead: false },
      data: { isRead: true, status: 'READ' },
    })

    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    })
  }
}

export const messageService = new MessageService()
