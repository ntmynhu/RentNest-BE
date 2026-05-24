import { prisma } from '~/config/database'
import { BadRequestError, ForbiddenRequestError, NotFoundRequestError } from '~/core/error.response'
import { CreatePaymentDto, MarkPaidDto } from '~/dtos/payment'
import { UserRole } from '~/enums/user.enum'

export class PaymentService {
  // UC10: Get payments - role-based access
  async getPayments(userId: number, role: UserRole, filters?: { status?: string }) {
    let where: any = {}

    if (role === UserRole.TENANT) {
      const tenant = await prisma.tenant.findFirst({ where: { userId } })
      if (!tenant) return { payments: [], summary: { totalPaid: 0, totalPending: 0, totalOverdue: 0 } }
      where.tenantId = tenant.id
    } else if (role === UserRole.LANDLORD) {
      where.landlordId = userId
    }

    if (filters?.status) where.status = filters.status

    const payments = await prisma.payment.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true, email: true, phone: true } },
        contract: { select: { id: true, startDate: true, endDate: true } },
      },
      orderBy: { dueDate: 'desc' },
    })

    // UC10: Auto-calculate overdue status
    const now = new Date()
    const updatedPayments = await Promise.all(
      payments.map(async (p) => {
        if (p.status !== 'PAID') {
          const newStatus = now > p.dueDate ? 'OVERDUE' : 'PENDING'
          if (p.status !== newStatus) {
            await prisma.payment.update({ where: { id: p.id }, data: { status: newStatus } })
            return { ...p, status: newStatus }
          }
        }
        return p
      })
    )

    const summary = {
      totalPaid: updatedPayments.filter((p) => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0),
      totalPending: updatedPayments.filter((p) => p.status === 'PENDING').reduce((s, p) => s + Number(p.amount), 0),
      totalOverdue: updatedPayments.filter((p) => p.status === 'OVERDUE').reduce((s, p) => s + Number(p.amount), 0),
    }

    return { payments: updatedPayments, summary }
  }

  // Create payment record
  async createPayment(landlordId: number, dto: CreatePaymentDto) {
    const contract = await prisma.contract.findFirst({
      where: { id: dto.contractId, landlordId },
    })
    if (!contract) throw new NotFoundRequestError('Contract not found')

    const tenant = await prisma.tenant.findFirst({
      where: { id: dto.tenantId, landlordId },
    })
    if (!tenant) throw new NotFoundRequestError('Tenant not found')

    return prisma.payment.create({
      data: {
        contractId: dto.contractId,
        tenantId: dto.tenantId,
        landlordId,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        note: dto.note,
        status: 'PENDING',
      },
    })
  }

  // UC10: Mark payment as paid
  async markAsPaid(userId: number, role: UserRole, paymentId: number, dto: MarkPaidDto) {
    const where: any = { id: paymentId }
    if (role === UserRole.LANDLORD) where.landlordId = userId

    const payment = await prisma.payment.findFirst({ where })
    if (!payment) throw new NotFoundRequestError('Payment not found')
    if (payment.status === 'PAID') throw new BadRequestError('Payment is already marked as paid')

    // Include tenant.userId so controller can emit socket notification (ASR-21)
    return prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'PAID', paidDate: new Date(dto.paidDate) },
      include: { tenant: { select: { userId: true } } },
    })
  }

  // Run by cron: auto-update overdue payments
  async updateOverduePayments() {
    const now = new Date()
    const result = await prisma.payment.updateMany({
      where: { status: 'PENDING', dueDate: { lt: now } },
      data: { status: 'OVERDUE' },
    })
    return result.count
  }
}

export const paymentService = new PaymentService()
