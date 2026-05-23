import { Request, Response } from 'express'
import { reportService } from '~/services/report.service'
import { SuccessResponse, CreatedResponse } from '~/core/success.response'

class ReportController {
  create = async (req: Request, res: Response) => {
    const report = await reportService.createReport(req.user!.id, req.body)
    return new CreatedResponse({ message: 'Report submitted', metaData: report }).send(res)
  }

  getAll = async (req: Request, res: Response) => {
    const result = await reportService.getReports(req.query)
    return new SuccessResponse({ message: 'Reports retrieved', metaData: result }).send(res)
  }

  resolve = async (req: Request, res: Response) => {
    const { status } = req.body
    const report = await reportService.resolveReport(req.user!.id, parseInt(req.params.id as string), status)
    return new SuccessResponse({ message: 'Report resolved', metaData: report }).send(res)
  }
}

export const reportController = new ReportController()
