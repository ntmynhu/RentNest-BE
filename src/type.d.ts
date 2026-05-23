import { UserRole } from './enums/user.enum'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        email: string
        fullName: string
        role: UserRole
        status: string
      }
      decodedToken?: {
        userId: number
        tokenType: string
        iat: number
        exp: number
      }
    }
  }
}

export {}
