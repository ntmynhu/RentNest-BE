import cron from 'node-cron'
import { prisma } from '~/config/database'
import { paymentService } from './payment.service'
import { emailService } from './email.service'

export class CronService {
  init() {
    // UC10: Run daily at 00:05 - update overdue payments
    cron.schedule('5 0 * * *', async () => {
      try {
        const count = await paymentService.updateOverduePayments()
        console.log(`[Cron] Marked ${count} payments as OVERDUE`)
      } catch (e) {
        console.error('[Cron] Failed to update overdue payments:', e)
      }
    })

    // UC10: Run daily at 09:00 - send payment reminders (3 days before due)
    cron.schedule('0 9 * * *', async () => {
      try {
        const threeDaysFromNow = new Date()
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 2)

        const upcomingPayments = await prisma.payment.findMany({
          where: {
            status: 'PENDING',
            dueDate: { gte: tomorrow, lte: threeDaysFromNow },
          },
          include: {
            tenant: { include: { user: true } },
          },
        })

        for (const payment of upcomingPayments) {
          const email = payment.tenant.user?.email || payment.tenant.email
          await emailService.sendPaymentReminderEmail(
            email,
            payment.tenant.name,
            Number(payment.amount),
            payment.dueDate
          )
        }

        console.log(`[Cron] Sent ${upcomingPayments.length} payment reminders`)
      } catch (e) {
        console.error('[Cron] Failed to send payment reminders:', e)
      }
    })

    // Run weekly - auto-expire contracts past end date
    cron.schedule('0 1 * * 0', async () => {
      try {
        const result = await prisma.contract.updateMany({
          where: { status: 'ACTIVE', endDate: { lt: new Date() } },
          data: { status: 'EXPIRED' },
        })
        console.log(`[Cron] Expired ${result.count} contracts`)
      } catch (e) {
        console.error('[Cron] Failed to expire contracts:', e)
      }
    })

    console.log('[Cron] Scheduled jobs initialized')
  }
}

export const cronService = new CronService()
