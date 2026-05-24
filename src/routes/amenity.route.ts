import { Router, Request, Response } from 'express'
import { prisma } from '~/config/database'
import { SuccessResponse } from '~/core/success.response'
import { wrapRequestHandler } from '~/utils/handler'

const router = Router()

// GET /api/amenities — public, no auth needed
router.get('/', wrapRequestHandler(async (_req: Request, res: Response) => {
  const amenities = await prisma.amenity.findMany({ orderBy: { name: 'asc' } })
  return new SuccessResponse({ message: 'Amenities retrieved', metaData: amenities }).send(res)
}))

export default router
