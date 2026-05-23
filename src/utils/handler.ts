import { RequestHandler, Request, Response, NextFunction, ErrorRequestHandler } from 'express'
import { ErrorResponse, NotFoundRequestError } from '~/core/error.response'

export const wrapRequestHandler = <P = any>(handler: RequestHandler<P>) => {
  return (req: Request<P>, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}

export const errorHandler: ErrorRequestHandler = (
  err: ErrorResponse | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof ErrorResponse ? err.statusCode : 500
  const message = err.message || 'Internal Server Error'

  res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message,
  })

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${err.name}] ${err.message}\n${err.stack}`)
  }
}

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundRequestError(`Route ${req.method} ${req.originalUrl} not found`))
}
