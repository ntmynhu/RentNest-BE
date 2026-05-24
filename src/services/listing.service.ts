import { prisma } from '~/config/database'
import { BadRequestError, ForbiddenRequestError, NotFoundRequestError } from '~/core/error.response'
import { ListingStatus, SortBy } from '~/enums/listing.enum'
import { UserRole } from '~/enums/user.enum'
import { getPaginationParams, buildPaginatedResponse } from '~/utils/helpers'
import { CreateListingDto, SearchListingDto } from '~/dtos/listing'
import { emailService } from './email.service'

export class ListingService {
  // UC7: Post Room Listing
  async createListing(landlordId: number, dto: CreateListingDto, imageUrls: string[]) {
    const listing = await prisma.listing.create({
      data: {
        landlordId,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        address: dto.address,
        district: dto.district,
        city: dto.city,
        area: dto.area,
        roomType: dto.roomType as any,
        status: ListingStatus.PENDING_APPROVAL,
        ...(imageUrls.length > 0 && {
          images: {
            create: imageUrls.map((url, i) => ({ url, isPrimary: i === 0 })),
          },
        }),
        ...(dto.amenityIds?.length && {
          amenities: {
            create: dto.amenityIds.map((amenityId) => ({ amenityId })),
          },
        }),
      },
      include: {
        images: true,
        amenities: { include: { amenity: true } },
      },
    })

    return listing
  }

  // UC4: Search & Filter Rooms
  async searchListings(dto: SearchListingDto) {
    const { page, limit, skip } = getPaginationParams(dto)

    const where: any = {
      status: ListingStatus.PUBLISHED,
      deletedAt: null,
    }

    if (dto.keyword) {
      where.OR = [
        { title: { contains: dto.keyword, mode: 'insensitive' } },
        { description: { contains: dto.keyword, mode: 'insensitive' } },
        { address: { contains: dto.keyword, mode: 'insensitive' } },
      ]
    }
    if (dto.location) {
      where.OR = [
        ...(where.OR || []),
        { city: { contains: dto.location, mode: 'insensitive' } },
        { district: { contains: dto.location, mode: 'insensitive' } },
        { address: { contains: dto.location, mode: 'insensitive' } },
      ]
    }
    if (dto.priceMin !== undefined) where.price = { ...where.price, gte: dto.priceMin }
    if (dto.priceMax !== undefined) where.price = { ...where.price, lte: dto.priceMax }
    if (dto.roomType) where.roomType = dto.roomType
    if (dto.areaMin !== undefined) where.area = { ...where.area, gte: dto.areaMin }
    if (dto.areaMax !== undefined) where.area = { ...where.area, lte: dto.areaMax }

    const orderBy = this.buildOrderBy(dto.sortBy)

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          amenities: { include: { amenity: true } },
          reviews: { select: { rating: true } },
          landlord: { select: { id: true, fullName: true, avatar: true } },
        },
      }),
      prisma.listing.count({ where }),
    ])

    const listingsWithRating = listings.map((l) => ({
      ...l,
      avgRating: l.reviews.length ? l.reviews.reduce((s, r) => s + r.rating, 0) / l.reviews.length : null,
      reviewCount: l.reviews.length,
    }))

    return buildPaginatedResponse(listingsWithRating, total, page, limit)
  }

  private buildOrderBy(sortBy?: SortBy) {
    switch (sortBy) {
      case SortBy.LOWEST_PRICE: return { price: 'asc' as const }
      case SortBy.HIGHEST_PRICE: return { price: 'desc' as const }
      case SortBy.LARGEST_AREA: return { area: 'desc' as const }
      default: return { createdAt: 'desc' as const }
    }
  }

  // Get listing detail
  async getListingById(listingId: number, userId?: number) {
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, deletedAt: null },
      include: {
        images: true,
        amenities: { include: { amenity: true } },
        reviews: {
          include: { tenant: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        landlord: { select: { id: true, fullName: true, avatar: true, phone: true, createdAt: true } },
      },
    })
    if (!listing) throw new NotFoundRequestError('Listing not found')

    // Track view behavior
    if (userId) {
      await prisma.userBehavior.create({
        data: { userId, listingId, behaviorType: 'VIEW' },
      }).catch(() => {}) // non-blocking
    }

    // Increment view count
    await prisma.listing.update({ where: { id: listingId }, data: { viewCount: { increment: 1 } } })

    const avgRating = listing.reviews.length
      ? listing.reviews.reduce((s, r) => s + r.rating, 0) / listing.reviews.length
      : null

    return { ...listing, avgRating, reviewCount: listing.reviews.length }
  }

  // Get landlord's own listings
  async getLandlordListings(landlordId: number) {
    return prisma.listing.findMany({
      where: { landlordId, deletedAt: null },
      include: { images: { where: { isPrimary: true }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    })
  }

  // Update listing
  async updateListing(landlordId: number, listingId: number, data: Partial<CreateListingDto>, imageUrls?: string[]) {
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, landlordId, deletedAt: null },
    })
    if (!listing) throw new NotFoundRequestError('Listing not found')

    const needsReApproval = [ListingStatus.PUBLISHED, ListingStatus.REJECTED]
    const statusReset = needsReApproval.includes(listing.status as ListingStatus)
      ? { status: ListingStatus.PENDING_APPROVAL, rejectionReason: null }
      : {}

    // Handle image replacement if new imageUrls provided
    if (imageUrls !== undefined) {
      await prisma.listingImage.deleteMany({ where: { listingId } })
      if (imageUrls.length > 0) {
        await prisma.listingImage.createMany({
          data: imageUrls.map((url, i) => ({ listingId, url, isPrimary: i === 0 })),
        })
      }
    }

    // Handle amenity replacement if amenityIds provided
    const { imageUrls: _img, amenityIds, ...fields } = data as any
    if (amenityIds !== undefined) {
      await prisma.listingAmenity.deleteMany({ where: { listingId } })
      if (amenityIds.length > 0) {
        await prisma.listingAmenity.createMany({
          data: amenityIds.map((amenityId: number) => ({ listingId, amenityId })),
        })
      }
    }

    return prisma.listing.update({
      where: { id: listingId },
      data: { ...fields, ...statusReset },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        amenities: { include: { amenity: true } },
      },
    })
  }

  // Soft delete listing
  async deleteListing(landlordId: number, listingId: number) {
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, landlordId, deletedAt: null },
    })
    if (!listing) throw new NotFoundRequestError('Listing not found')

    return prisma.listing.update({
      where: { id: listingId },
      data: { deletedAt: new Date() },
    })
  }

  // UC13: Approve listing (Admin)
  async approveListing(adminId: number, listingId: number) {
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, status: ListingStatus.PENDING_APPROVAL, deletedAt: null },
      include: { landlord: true },
    })
    if (!listing) throw new NotFoundRequestError('Listing not found or not pending approval')

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { status: ListingStatus.PUBLISHED, approvedAt: new Date(), approvedBy: adminId },
    })

    // Gửi email thông báo — không block nếu email lỗi (chưa cấu hình SMTP)
    emailService.sendListingApprovedEmail(listing.landlord.email, listing.landlord.fullName, listing.title)
      .catch(err => console.warn('[Email] sendListingApprovedEmail failed:', err.message))

    return updated
  }

  // UC13: Reject listing (Admin)
  async rejectListing(adminId: number, listingId: number, rejectionReason: string) {
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, status: ListingStatus.PENDING_APPROVAL, deletedAt: null },
      include: { landlord: true },
    })
    if (!listing) throw new NotFoundRequestError('Listing not found or not pending approval')

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { status: ListingStatus.REJECTED, rejectionReason },
    })

    // Gửi email thông báo — không block nếu email lỗi
    emailService.sendListingRejectedEmail(
      listing.landlord.email,
      listing.landlord.fullName,
      listing.title,
      rejectionReason
    ).catch(err => console.warn('[Email] sendListingRejectedEmail failed:', err.message))

    return updated
  }

  // Get pending listings queue (Admin)
  async getPendingListings(page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where: { status: ListingStatus.PENDING_APPROVAL, deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          landlord: { select: { id: true, fullName: true, email: true } },
        },
      }),
      prisma.listing.count({ where: { status: ListingStatus.PENDING_APPROVAL, deletedAt: null } }),
    ])
    return buildPaginatedResponse(listings, total, page, limit)
  }
}

export const listingService = new ListingService()
