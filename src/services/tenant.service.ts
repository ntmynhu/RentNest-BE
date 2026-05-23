import { prisma } from '~/config/database'
import { BadRequestError, ConflictError, ForbiddenRequestError, NotFoundRequestError } from '~/core/error.response'
import { CreateTenantDto, UpdateTenantDto } from '~/dtos/tenant'

export class TenantService {
  // UC8: Add tenant
  async createTenant(landlordId: number, dto: CreateTenantDto) {
    const listing = await prisma.listing.findFirst({
      where: { id: dto.listingId, landlordId, deletedAt: null },
    })
    if (!listing) throw new NotFoundRequestError('Listing not found or not owned by you')

    const duplicate = await prisma.tenant.findFirst({
      where: {
        listingId: dto.listingId,
        status: 'ACTIVE',
        OR: [{ email: dto.email }, { phone: dto.phone }],
      },
    })
    if (duplicate) throw new ConflictError('A tenant with this email or phone already exists for this room')

    const moveInDate = new Date(dto.moveInDate)
    if (isNaN(moveInDate.getTime())) throw new BadRequestError('Invalid move-in date')

    return prisma.tenant.create({
      data: {
        landlordId,
        listingId: dto.listingId,
        userId: dto.userId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        moveInDate,
        status: 'ACTIVE',
      },
    })
  }

  // Get tenants for a landlord
  async getLandlordTenants(landlordId: number, listingId?: number) {
    return prisma.tenant.findMany({
      where: {
        landlordId,
        deletedAt: null,
        ...(listingId && { listingId }),
      },
      include: {
        listing: { select: { id: true, title: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // UC8: Update tenant
  async updateTenant(landlordId: number, tenantId: number, dto: UpdateTenantDto) {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, landlordId, deletedAt: null },
    })
    if (!tenant) throw new NotFoundRequestError('Tenant not found')

    if (dto.listingId) {
      const listing = await prisma.listing.findFirst({
        where: { id: dto.listingId, landlordId, deletedAt: null },
      })
      if (!listing) throw new NotFoundRequestError('Listing not found or not owned by you')
    }

    return prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.email && { email: dto.email }),
        ...(dto.phone && { phone: dto.phone }),
        ...(dto.moveInDate && { moveInDate: new Date(dto.moveInDate) }),
        ...(dto.moveOutDate && { moveOutDate: new Date(dto.moveOutDate) }),
        ...(dto.listingId && { listingId: dto.listingId }),
      },
    })
  }

  // UC8: Remove tenant (soft delete)
  async removeTenant(landlordId: number, tenantId: number) {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, landlordId, deletedAt: null },
    })
    if (!tenant) throw new NotFoundRequestError('Tenant not found')

    return prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'INACTIVE', deletedAt: new Date() },
    })
  }

  async getTenantById(landlordId: number, tenantId: number) {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, landlordId, deletedAt: null },
      include: {
        listing: true,
        contracts: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { dueDate: 'desc' } },
      },
    })
    if (!tenant) throw new NotFoundRequestError('Tenant not found')
    return tenant
  }
}

export const tenantService = new TenantService()
