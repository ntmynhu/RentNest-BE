import { Request, Response } from 'express'
import { listingService } from '~/services/listing.service'
import { recommendationService } from '~/services/recommendation.service'
import { SuccessResponse, CreatedResponse } from '~/core/success.response'

class ListingController {
  // POST /api/listings  (UC7: Post Room Listing)
  createListing = async (req: Request, res: Response) => {
    const imageUrls: string[] = req.body.imageUrls || []
    const listing = await listingService.createListing(req.user!.id, req.body, imageUrls)
    return new CreatedResponse({ message: 'Listing submitted for review', metaData: listing }).send(res)
  }

  // GET /api/listings  (UC4: Search & Filter)
  searchListings = async (req: Request, res: Response) => {
    const result = await listingService.searchListings(req.query as any)
    return new SuccessResponse({ message: 'Listings retrieved', metaData: result }).send(res)
  }

  // GET /api/listings/recommendations  (UC5: Get Recommendations)
  getRecommendations = async (req: Request, res: Response) => {
    const userId = req.user?.id
    const listings = userId
      ? await recommendationService.getRecommendations(userId)
      : await recommendationService.getDefaultRecommendations()
    return new SuccessResponse({ message: 'Recommendations retrieved', metaData: listings }).send(res)
  }

  // GET /api/listings/my  (Landlord's own listings)
  getMyListings = async (req: Request, res: Response) => {
    const listings = await listingService.getLandlordListings(req.user!.id)
    return new SuccessResponse({ message: 'Listings retrieved', metaData: listings }).send(res)
  }

  // GET /api/listings/:id
  getListingById = async (req: Request, res: Response) => {
    const listing = await listingService.getListingById(parseInt(req.params.id as string), req.user?.id)
    return new SuccessResponse({ message: 'Listing retrieved', metaData: listing }).send(res)
  }

  // PUT /api/listings/:id
  updateListing = async (req: Request, res: Response) => {
    const { imageUrls, ...rest } = req.body
    const listing = await listingService.updateListing(
      req.user!.id,
      parseInt(req.params.id as string),
      rest,
      imageUrls,
    )
    return new SuccessResponse({ message: 'Listing updated', metaData: listing }).send(res)
  }

  // DELETE /api/listings/:id
  deleteListing = async (req: Request, res: Response) => {
    await listingService.deleteListing(req.user!.id, parseInt(req.params.id as string))
    return new SuccessResponse({ message: 'Listing deleted' }).send(res)
  }

  // Admin routes (UC13)
  getPendingListings = async (req: Request, res: Response) => {
    const result = await listingService.getPendingListings(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20
    )
    return new SuccessResponse({ message: 'Pending listings retrieved', metaData: result }).send(res)
  }

  approveListing = async (req: Request, res: Response) => {
    const listing = await listingService.approveListing(req.user!.id, parseInt(req.params.id as string))
    return new SuccessResponse({ message: 'Listing approved', metaData: listing }).send(res)
  }

  rejectListing = async (req: Request, res: Response) => {
    const { rejectionReason } = req.body
    const listing = await listingService.rejectListing(req.user!.id, parseInt(req.params.id as string), rejectionReason)
    return new SuccessResponse({ message: 'Listing rejected', metaData: listing }).send(res)
  }
}

export const listingController = new ListingController()
