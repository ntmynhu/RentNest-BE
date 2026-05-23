import { Request, Response, NextFunction } from 'express'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { BadRequestError } from '~/core/error.response'

export const validateDto = (DtoClass: any, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToInstance(DtoClass, req[source])
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: false })

    if (errors.length > 0) {
      const messages = errors.flatMap((e) => Object.values(e.constraints || {}))
      return next(new BadRequestError(messages[0] || 'Validation failed'))
    }

    // req.query is read-only in Express 5 – skip reassignment for query params
    if (source !== 'query') {
      req[source] = dto as any
    }
    next()
  }
}
