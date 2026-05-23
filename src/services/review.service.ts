import { prisma } from '~/config/database'
import { BadRequestError, ConflictError, ForbiddenRequestError, NotFoundRequestError } from '~/core/error.response'
import { CreateReviewDto } from '~/dtos/review'

export class ReviewService {
  // UC11: Create review - tenant must have moved out
  async createReview(userId: number, listingId: number, dto: CreateReviewDto) {
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, deletedAt: null },
    })
    if (!listing) throw new NotFoundRequestError('Listing not found')

    // Verify tenant eligibility: moved out of this listing
    const tenant = await prisma.tenant.findFirst({
      where: {
        userId,
        listingId,
        moveOutDate: { lt: new Date() },
      },
    })
    if (!tenant) throw new ForbiddenRequestError('You can only review a listing after your move-out date')

    // Prevent duplicate review
    const existing = await prisma.review.findFirst({
      where: { tenantId: tenant.id, listingId },
    })
    if (existing) throw new ConflictError('You have already reviewed this listing')

    if (dto.rating < 1 || dto.rating > 5) throw new BadRequestError('Rating must be between 1 and 5')

    return prisma.review.create({
      data: {
        tenantId: tenant.id,
        listingId,
        rating: dto.rating,
        text: dto.text,
        isVerified: true,
        status: 'PUBLISHED',
      },
    })
  }

  async getListingReviews(listingId: number) {
    return prisma.review.findMany({
      where: { listingId, status: 'PUBLISHED' },
      include: {
        tenant: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}

export const reviewService = new ReviewService()
