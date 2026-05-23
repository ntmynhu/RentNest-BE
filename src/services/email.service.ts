import { transporter } from '~/config/email'
import { env } from '~/config/env'

export class EmailService {
  async sendVerificationEmail(email: string, fullName: string, verifyLink: string) {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Verify Registration RentNest Account',
      html: `
        <p>Hello ${fullName},</p>
        <p>Follow this link to verify your email address to finish your registration step.</p>
        <p><a href="${verifyLink}">${verifyLink}</a></p>
        <p>If you didn't ask to verify this address, you can ignore this email.</p>
        <p>Thanks,<br>The RentNest team</p>
      `,
    })
  }

  async sendResetPasswordEmail(email: string, fullName: string, resetLink: string) {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Reset Password',
      html: `
        <p>Hello ${fullName},</p>
        <p>You have requested to reset the password of your RENTNEST account.</p>
        <p>Please click the link to change your password:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>If you didn't ask to reset your password, you can ignore this email.</p>
        <p>Thanks,<br>The RentNest team</p>
      `,
    })
  }

  async sendListingApprovedEmail(email: string, landlordName: string, listingTitle: string) {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Your RentNest listing has been approved',
      html: `
        <p>Hello ${landlordName},</p>
        <p>Your listing "<strong>${listingTitle}</strong>" has been approved and is now visible to all users.</p>
        <p>Thanks,<br>The RentNest Team</p>
      `,
    })
  }

  async sendListingRejectedEmail(email: string, landlordName: string, listingTitle: string, reason: string) {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Your RentNest listing was not approved',
      html: `
        <p>Hello ${landlordName},</p>
        <p>Your listing "<strong>${listingTitle}</strong>" was rejected.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please edit and resubmit your listing to address the issue.</p>
        <p>Thanks,<br>The RentNest Team</p>
      `,
    })
  }

  async sendWarningEmail(email: string, username: string, warningReason: string) {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Warning: Policy Violation on RentNest',
      html: `
        <p>Hello ${username},</p>
        <p>Your account has received a warning for: <strong>${warningReason}</strong></p>
        <p>Further violations may result in a permanent ban.</p>
        <p>Thanks,<br>The RentNest Team</p>
      `,
    })
  }

  async sendBanEmail(email: string, username: string, banReason: string) {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Your RentNest Account Has Been Suspended',
      html: `
        <p>Hello ${username},</p>
        <p>Your account has been suspended due to: <strong>${banReason}</strong></p>
        <p>If you believe this is a mistake, please contact <a href="mailto:support@rentnest.com">support@rentnest.com</a> to appeal.</p>
        <p>Thanks,<br>The RentNest Team</p>
      `,
    })
  }

  async sendPaymentReminderEmail(email: string, tenantName: string, amount: number, dueDate: Date) {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Payment Reminder - RentNest',
      html: `
        <p>Hello ${tenantName},</p>
        <p>This is a reminder that you have a payment of <strong>${amount.toLocaleString('vi-VN')} VNĐ</strong> due on <strong>${dueDate.toLocaleDateString('vi-VN')}</strong>.</p>
        <p>Please log in to your RentNest account to process your payment.</p>
        <p>Thanks,<br>The RentNest Team</p>
      `,
    })
  }
}

export const emailService = new EmailService()
