import nodemailer from 'nodemailer'
import { env } from './env'

export const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: env.EMAIL_PORT === 465,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
})

// Log email config status on startup
if (env.EMAIL_USER && env.EMAIL_PASS) {
  transporter.verify()
    .then(() => console.log('[Email] SMTP connection OK:', env.EMAIL_USER))
    .catch(err => console.warn('[Email] SMTP connection FAILED:', err.message))
} else {
  console.warn('[Email] EMAIL_USER or EMAIL_PASS not set — emails will not be sent')
}
