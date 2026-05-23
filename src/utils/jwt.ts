import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { env } from '~/config/env'

const SALT_ROUNDS = 10

export const hashData = async (data: string): Promise<string> => {
  return bcrypt.hash(data, SALT_ROUNDS)
}

export const compareHash = async (data: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(data, hash)
}

export const signAccessToken = (userId: number): string => {
  return jwt.sign({ userId, tokenType: 'ACCESS_TOKEN' }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  })
}

export const signRefreshToken = (userId: number): string => {
  return jwt.sign({ userId, tokenType: 'REFRESH_TOKEN' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  })
}

export const signEmailVerifyToken = (userId: number): string => {
  return jwt.sign({ userId, tokenType: 'VERIFY_EMAIL' }, env.JWT_VERIFY_EMAIL_SECRET, {
    expiresIn: '24h',
  })
}

export const signResetPasswordToken = (userId: number): string => {
  return jwt.sign({ userId, tokenType: 'RESET_PASSWORD' }, env.JWT_RESET_PASSWORD_SECRET, {
    expiresIn: '1h',
  })
}

export const verifyToken = (token: string, secret: string): any => {
  return jwt.verify(token, secret)
}
