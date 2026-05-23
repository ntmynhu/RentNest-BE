import { Router } from 'express'
import { listingController } from '~/controllers/listing.controller'
import { authenticate, requireRole } from '~/middlewares/auth.middleware'
import { validateDto } from '~/middlewares/dtoValidation.middleware'
import { wrapRequestHandler } from '~/utils/handler'
import { CreateListingDto, SearchListingDto } from '~/dtos/listing'
import { RejectListingDto } from '~/dtos/user'
import { UserRole } from '~/enums/user.enum'

const router = Router()

// Public routes (UC4, UC5)
router.get('/',               validateDto(SearchListingDto, 'query'), wrapRequestHandler(listingController.searchListings))
router.get('/recommendations', wrapRequestHandler(listingController.getRecommendations))

// Auth-optional (track behavior for logged-in users)
router.get('/:id',            wrapRequestHandler(listingController.getListingById))

// Landlord routes
router.post('/',              authenticate, requireRole(UserRole.LANDLORD), validateDto(CreateListingDto), wrapRequestHandler(listingController.createListing))
router.get('/my/listings',    authenticate, requireRole(UserRole.LANDLORD), wrapRequestHandler(listingController.getMyListings))
router.put('/:id',            authenticate, requireRole(UserRole.LANDLORD), wrapRequestHandler(listingController.updateListing))
router.delete('/:id',         authenticate, requireRole(UserRole.LANDLORD), wrapRequestHandler(listingController.deleteListing))

// Admin routes (UC13)
router.get('/admin/pending',  authenticate, requireRole(UserRole.ADMIN), wrapRequestHandler(listingController.getPendingListings))
router.patch('/:id/approve',  authenticate, requireRole(UserRole.ADMIN), wrapRequestHandler(listingController.approveListing))
router.patch('/:id/reject',   authenticate, requireRole(UserRole.ADMIN), validateDto(RejectListingDto), wrapRequestHandler(listingController.rejectListing))

export default router
