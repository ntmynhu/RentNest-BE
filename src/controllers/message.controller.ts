import { Request, Response } from 'express'
import { messageService } from '~/services/message.service'
import { SuccessResponse, CreatedResponse } from '~/core/success.response'
import { UserRole } from '~/enums/user.enum'

class MessageController {
  // UC6: Tenant → Landlord
  sendToLandlord = async (req: Request, res: Response) => {
    const result = await messageService.sendMessageToLandlord(
      req.user!.id,
      parseInt(req.params.landlordId),
      req.body
    )
    return new CreatedResponse({ message: 'Message sent', metaData: result }).send(res)
  }

  // UC14: Landlord → Tenant
  sendToTenant = async (req: Request, res: Response) => {
    const result = await messageService.sendMessageToTenant(
      req.user!.id,
      parseInt(req.params.tenantId),
      req.body
    )
    return new CreatedResponse({ message: 'Message sent', metaData: result }).send(res)
  }

  getConversations = async (req: Request, res: Response) => {
    const conversations = await messageService.getConversations(req.user!.id, req.user!.role)
    return new SuccessResponse({ message: 'Conversations retrieved', metaData: conversations }).send(res)
  }

  getMessages = async (req: Request, res: Response) => {
    const messages = await messageService.getMessages(req.user!.id, parseInt(req.params.conversationId))
    return new SuccessResponse({ message: 'Messages retrieved', metaData: messages }).send(res)
  }
}

export const messageController = new MessageController()
