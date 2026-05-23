import { Request, Response } from 'express'
import { reviewService } from '~/services/review.service'
import { SuccessResponse, CreatedResponse } from '~/core/success.response'

class ReviewController {
  create = async (req: Request, res: Response) => {
    const review = await reviewService.createReview(req.user!.id, parseInt(req.params.listingId), req.body)
    return new CreatedResponse({ message: 'Review submitted', metaData: review }).send(res)
  }

  getByListing = async (req: Request, res: Response) => {
    const reviews = await reviewService.getListingReviews(parseInt(req.params.listingId))
    return new SuccessResponse({ message: 'Reviews retrieved', metaData: reviews }).send(res)
  }
}

export const reviewController = new ReviewController()
