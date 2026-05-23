import { Router } from 'express'
import authRoute     from './auth.route'
import listingRoute  from './listing.route'
import tenantRoute   from './tenant.route'
import contractRoute from './contract.route'
import paymentRoute  from './payment.route'
import reviewRoute   from './review.route'
import messageRoute  from './message.route'
import reportRoute   from './report.route'
import userRoute     from './user.route'
import uploadRoute   from './upload.route'

const router = Router()

router.use('/auth',      authRoute)
router.use('/listings',  listingRoute)
router.use('/tenants',   tenantRoute)
router.use('/contracts', contractRoute)
router.use('/payments',  paymentRoute)
router.use('/reviews',   reviewRoute)
router.use('/messages',  messageRoute)
router.use('/reports',   reportRoute)
router.use('/users',     userRoute)
router.use('/upload',    uploadRoute)

export default router
