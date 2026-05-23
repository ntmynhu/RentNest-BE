export class ErrorResponse extends Error {
  public statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.name = this.constructor.name
  }
}

export class BadRequestError extends ErrorResponse {
  constructor(message: string = 'Bad Request') {
    super(message, 400)
  }
}

export class AuthRequestError extends ErrorResponse {
  constructor(message: string = 'Authentication error') {
    super(message, 401)
  }
}

export class ForbiddenRequestError extends ErrorResponse {
  constructor(message: string = 'Forbidden') {
    super(message, 403)
  }
}

export class NotFoundRequestError extends ErrorResponse {
  constructor(message: string = 'Not found') {
    super(message, 404)
  }
}

export class ConflictError extends ErrorResponse {
  constructor(message: string = 'Conflict') {
    super(message, 409)
  }
}

export class UnprocessableEntityError extends ErrorResponse {
  constructor(message: string = 'Unprocessable Entity') {
    super(message, 422)
  }
}
