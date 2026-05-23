import { Response } from 'express'

interface SuccessResponseOptions {
  message?: string
  metaData?: object
  statusCode?: number
}

export class SuccessResponse {
  message: string
  status: string
  metaData: object

  constructor({ message = 'Success', metaData = {}, statusCode = 200 }: SuccessResponseOptions) {
    this.message = message
    this.status = 'success'
    this.metaData = metaData
    this.send = (res: Response) => res.status(statusCode).json(this)
  }

  send: (res: Response) => Response
}

export class CreatedResponse extends SuccessResponse {
  constructor({ message = 'Created', metaData = {} }: Omit<SuccessResponseOptions, 'statusCode'>) {
    super({ message, metaData, statusCode: 201 })
  }
}
