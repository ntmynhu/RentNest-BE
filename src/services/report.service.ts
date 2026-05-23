import { prisma } from '~/config/database'
import { NotFoundRequestError } from '~/core/error.response'
import { CreateReportDto } from '~/dtos/report'
import { getPaginationParams, buildPaginatedResponse } from '~/utils/helpers'

export class ReportService {
  // UC12: Create report
  async createReport(reporterId: number, dto: CreateReportDto) {
    return prisma.report.create({
      data: {
        reporterId,
        reportedItemType: dto.reportedItemType as any,
        reportedItemId: dto.reportedItemId,
        reason: dto.reason,
        description: dto.description,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        status: 'PENDING',
      },
    })
  }

  // Admin: Get all pending reports
  async getReports(query: any) {
    const { page, limit, skip } = getPaginationParams(query)
    const where: any = {}
    if (query.status) where.status = query.status

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { id: true, fullName: true, email: true } },
        },
      }),
      prisma.report.count({ where }),
    ])

    return buildPaginatedResponse(reports, total, page, limit)
  }

  // Admin: Resolve a report
  async resolveReport(adminId: number, reportId: number, status: string) {
    const report = await prisma.report.findUnique({ where: { id: reportId } })
    if (!report) throw new NotFoundRequestError('Report not found')

    return prisma.report.update({
      where: { id: reportId },
      data: { status: status as any, resolvedBy: adminId, resolvedAt: new Date() },
    })
  }
}

export const reportService = new ReportService()
