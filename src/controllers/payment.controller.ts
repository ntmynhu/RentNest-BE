import { Request, Response } from 'express'
import { paymentService } from '~/services/payment.service'
import { SuccessResponse, CreatedResponse } from '~/core/success.response'

class PaymentController {
  getAll = async (req: Request, res: Response) => {
    const result = await paymentService.getPayments(req.user!.id, req.user!.role, {
      status: req.query.status as string,
    })
    return new SuccessResponse({ message: 'Payments retrieved', metaData: result }).send(res)
  }

  create = async (req: Request, res: Response) => {
    const payment = await paymentService.createPayment(req.user!.id, req.body)
    return new CreatedResponse({ message: 'Payment record created', metaData: payment }).send(res)
  }

  markAsPaid = async (req: Request, res: Response) => {
    const payment = await paymentService.markAsPaid(req.user!.id, req.user!.role, parseInt(req.params.id as string), req.body)
    return new SuccessResponse({ message: 'Payment marked as paid', metaData: payment }).send(res)
  }
}

export const paymentController = new PaymentController()
