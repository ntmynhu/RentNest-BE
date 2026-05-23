import { prisma } from '~/config/database'
import { BadRequestError, ForbiddenRequestError, NotFoundRequestError } from '~/core/error.response'
import { CreateContractDto, UpdateContractDto } from '~/dtos/contract'

export class ContractService {
  // UC9: Create contract
  async createContract(landlordId: number, dto: CreateContractDto) {
    const tenant = await prisma.tenant.findFirst({
      where: { id: dto.tenantId, landlordId, deletedAt: null },
    })
    if (!tenant) throw new NotFoundRequestError('Tenant not found')

    const listing = await prisma.listing.findFirst({
      where: { id: dto.listingId, landlordId, deletedAt: null },
    })
    if (!listing) throw new NotFoundRequestError('Listing not found or not owned by you')

    const startDate = new Date(dto.startDate)
    const endDate = new Date(dto.endDate)

    if (startDate >= endDate) throw new BadRequestError('Start date must be before end date')
    if (dto.rentAmount <= 0) throw new BadRequestError('Rent amount must be greater than 0')
    if (dto.depositAmount < 0) throw new BadRequestError('Deposit amount cannot be negative')

    // Check for overlapping active contracts
    const overlapping = await prisma.contract.findFirst({
      where: {
        tenantId: dto.tenantId,
        listingId: dto.listingId,
        status: 'ACTIVE',
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    })
    if (overlapping) throw new BadRequestError('An active contract already exists for this tenant and room during this period')

    return prisma.contract.create({
      data: {
        landlordId,
        tenantId: dto.tenantId,
        listingId: dto.listingId,
        startDate,
        endDate,
        rentAmount: dto.rentAmount,
        depositAmount: dto.depositAmount,
        terms: dto.terms,
        status: 'DRAFT',
      },
      include: {
        tenant: true,
        listing: { select: { title: true, address: true } },
      },
    })
  }

  // UC9: Update contract
  async updateContract(landlordId: number, contractId: number, dto: UpdateContractDto) {
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, landlordId },
    })
    if (!contract) throw new NotFoundRequestError('Contract not found')

    if (contract.status === 'ARCHIVED') throw new BadRequestError('Cannot update an archived contract')

    const updateData: any = {}
    if (dto.startDate) updateData.startDate = new Date(dto.startDate)
    if (dto.endDate) updateData.endDate = new Date(dto.endDate)
    if (dto.rentAmount !== undefined) updateData.rentAmount = dto.rentAmount
    if (dto.depositAmount !== undefined) updateData.depositAmount = dto.depositAmount
    if (dto.terms) updateData.terms = dto.terms
    if (dto.status) updateData.status = dto.status

    if (updateData.startDate && updateData.endDate && updateData.startDate >= updateData.endDate) {
      throw new BadRequestError('Start date must be before end date')
    }

    return prisma.contract.update({ where: { id: contractId }, data: updateData })
  }

  // Activate contract: DRAFT → ACTIVE + tự sinh payments hàng tháng
  async activateContract(landlordId: number, contractId: number) {
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, landlordId },
    })
    if (!contract) throw new NotFoundRequestError('Contract not found')
    if (contract.status !== 'DRAFT') throw new BadRequestError('Chỉ có thể kích hoạt hợp đồng ở trạng thái Nháp')

    // Kích hoạt hợp đồng
    const activated = await prisma.contract.update({
      where: { id: contractId },
      data: { status: 'ACTIVE' },
      include: {
        tenant: { select: { id: true, name: true, email: true, phone: true } },
        listing: { select: { id: true, title: true, address: true } },
      },
    })

    // Tự động sinh payment hàng tháng từ startDate đến endDate
    const start = new Date(contract.startDate)
    const end   = new Date(contract.endDate)
    const payments: any[] = []

    const cur = new Date(start)
    while (cur <= end) {
      payments.push({
        contractId: contract.id,
        tenantId:   contract.tenantId,
        landlordId: contract.landlordId,
        amount:     contract.rentAmount,
        dueDate:    new Date(cur),
        status:     'PENDING',
        note:       `Tiền thuê tháng ${cur.getMonth() + 1}/${cur.getFullYear()}`,
      })
      cur.setMonth(cur.getMonth() + 1)
    }

    if (payments.length > 0) {
      await prisma.payment.createMany({ data: payments })
    }

    return activated
  }

  // UC9: Archive contract
  async archiveContract(landlordId: number, contractId: number) {
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, landlordId },
    })
    if (!contract) throw new NotFoundRequestError('Contract not found')

    const archivableStatuses = ['ENDED', 'EXPIRED']
    if (!archivableStatuses.includes(contract.status)) {
      throw new BadRequestError('Only ENDED or EXPIRED contracts can be archived')
    }

    return prisma.contract.update({ where: { id: contractId }, data: { status: 'ARCHIVED' } })
  }

  async getLandlordContracts(landlordId: number) {
    return prisma.contract.findMany({
      where: { landlordId },
      include: {
        tenant: { select: { id: true, name: true, email: true, phone: true } },
        listing: { select: { id: true, title: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // Tenant: view own contracts
  async getTenantContracts(userId: number) {
    const tenant = await prisma.tenant.findFirst({ where: { userId, deletedAt: null } })
    if (!tenant) return []

    return prisma.contract.findMany({
      where: { tenantId: tenant.id },
      include: {
        listing: { select: { id: true, title: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getContractById(landlordId: number, contractId: number) {
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, landlordId },
      include: {
        tenant: true,
        listing: true,
        payments: { orderBy: { dueDate: 'desc' } },
      },
    })
    if (!contract) throw new NotFoundRequestError('Contract not found')
    return contract
  }
}

export const contractService = new ContractService()
