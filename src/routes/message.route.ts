import { Router } from 'express'
import { messageController } from '~/controllers/message.controller'
import { authenticate, requireRole } from '~/middlewares/auth.middleware'
import { validateDto } from '~/middlewares/dtoValidation.middleware'
import { wrapRequestHandler } from '~/utils/handler'
import { SendMessageDto } from '~/dtos/message'
import { UserRole } from '~/enums/user.enum'

const router = Router()

router.use(authenticate)

router.get('/conversations',                        wrapRequestHandler(messageController.getConversations))
router.get('/conversations/:conversationId',        wrapRequestHandler(messageController.getMessages))

// UC6: Tenant → Landlord
router.post('/landlord/:landlordId',
  requireRole(UserRole.TENANT),
  validateDto(SendMessageDto),
  wrapRequestHandler(messageController.sendToLandlord)
)

// UC14: Landlord → Tenant
router.post('/tenant/:tenantId',
  requireRole(UserRole.LANDLORD),
  validateDto(SendMessageDto),
  wrapRequestHandler(messageController.sendToTenant)
)

export default router
