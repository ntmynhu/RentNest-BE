import { prisma } from '~/config/database'
import { ListingStatus } from '~/enums/listing.enum'

// UC5: Hybrid recommendation engine
// Algorithm: Content-Based Filtering + Collaborative Filtering + Popularity Score
// FinalScore = α(ContentScore) + β(CollaborativeScore) + γ(PopularityScore), α+β+γ=1
export class RecommendationService {
  private readonly ALPHA = 0.4  // content-based weight
  private readonly BETA  = 0.3  // collaborative weight
  private readonly GAMMA = 0.3  // popularity weight

  async getRecommendations(userId: number, limit = 12): Promise<any[]> {
    const behaviors = await prisma.userBehavior.findMany({
      where: { userId },
      include: { listing: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    if (behaviors.length < 3) {
      return this.getDefaultRecommendations(limit)
    }

    const [contentScores, collaborativeScores, popularityScores] = await Promise.all([
      this.computeContentScores(userId, behaviors),
      this.computeCollaborativeScores(userId, behaviors),
      this.computePopularityScores(),
    ])

    // Aggregate all candidate listing IDs
    const allIds = new Set([
      ...Object.keys(contentScores),
      ...Object.keys(collaborativeScores),
      ...Object.keys(popularityScores),
    ].map(Number))

    // Exclude already interacted listings
    const interactedIds = new Set(behaviors.map((b) => b.listingId))

    const scores: { listingId: number; score: number }[] = []
    for (const id of allIds) {
      if (interactedIds.has(id)) continue
      const score =
        this.ALPHA * (contentScores[id] || 0) +
        this.BETA  * (collaborativeScores[id] || 0) +
        this.GAMMA * (popularityScores[id] || 0)
      scores.push({ listingId: id, score })
    }

    scores.sort((a, b) => b.score - a.score)
    const topIds = scores.slice(0, limit).map((s) => s.listingId)

    if (topIds.length === 0) return this.getDefaultRecommendations(limit)

    const listings = await prisma.listing.findMany({
      where: { id: { in: topIds }, status: ListingStatus.PUBLISHED, deletedAt: null },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        amenities: { include: { amenity: true } },
        reviews: { select: { rating: true } },
      },
    })

    return listings.map((l) => ({
      ...l,
      avgRating: l.reviews.length ? l.reviews.reduce((s, r) => s + r.rating, 0) / l.reviews.length : null,
      recommendationScore: scores.find((s) => s.listingId === l.id)?.score,
    }))
  }

  // Content-Based: match listings by user's preferred attributes
  private async computeContentScores(userId: number, behaviors: any[]): Promise<Record<number, number>> {
    const weights: Record<string, number> = { BOOK: 5, FAVORITE: 4, SAVE: 3, CONTACT: 2, VIEW: 1 }

    // Build user preference profile
    const preferredRoomTypes: Record<string, number> = {}
    const preferredCities: Record<string, number> = {}
    let minPrice = Infinity, maxPrice = 0

    for (const b of behaviors) {
      const w = weights[b.behaviorType] || 1
      if (b.listing?.roomType) preferredRoomTypes[b.listing.roomType] = (preferredRoomTypes[b.listing.roomType] || 0) + w
      if (b.listing?.city) preferredCities[b.listing.city] = (preferredCities[b.listing.city] || 0) + w
      if (b.listing?.price) {
        minPrice = Math.min(minPrice, Number(b.listing.price))
        maxPrice = Math.max(maxPrice, Number(b.listing.price))
      }
    }

    const topRoomType = Object.entries(preferredRoomTypes).sort((a, b) => b[1] - a[1])[0]?.[0]
    const topCity     = Object.entries(preferredCities).sort((a, b) => b[1] - a[1])[0]?.[0]

    const candidates = await prisma.listing.findMany({
      where: {
        status: ListingStatus.PUBLISHED,
        deletedAt: null,
        OR: [
          ...(topRoomType ? [{ roomType: topRoomType as any }] : []),
          ...(topCity     ? [{ city: topCity }] : []),
        ],
      },
      select: { id: true, roomType: true, city: true, price: true },
      take: 200,
    })

    const scores: Record<number, number> = {}
    for (const l of candidates) {
      let score = 0
      if (l.roomType === topRoomType) score += 0.5
      if (l.city === topCity) score += 0.3
      const price = Number(l.price)
      if (price >= minPrice * 0.8 && price <= maxPrice * 1.2) score += 0.2
      scores[l.id] = score
    }
    return scores
  }

  // Collaborative Filtering: find similar users and recommend their favorites
  private async computeCollaborativeScores(userId: number, behaviors: any[]): Promise<Record<number, number>> {
    const myListingIds = behaviors.map((b) => b.listingId)
    if (myListingIds.length === 0) return {}

    // Users who interacted with the same listings
    const similarUserBehaviors = await prisma.userBehavior.findMany({
      where: { listingId: { in: myListingIds }, userId: { not: userId } },
      select: { userId: true, listingId: true, behaviorType: true },
    })

    const userOverlap: Record<number, number> = {}
    for (const b of similarUserBehaviors) {
      userOverlap[b.userId] = (userOverlap[b.userId] || 0) + 1
    }

    const topSimilarUsers = Object.entries(userOverlap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id]) => parseInt(id))

    const recommendations = await prisma.userBehavior.findMany({
      where: {
        userId: { in: topSimilarUsers },
        listingId: { notIn: myListingIds },
        behaviorType: { in: ['SAVE', 'FAVORITE', 'BOOK'] },
      },
      select: { listingId: true },
    })

    const scores: Record<number, number> = {}
    for (const r of recommendations) {
      scores[r.listingId] = (scores[r.listingId] || 0) + 1 / topSimilarUsers.length
    }
    return scores
  }

  // Popularity: high ratings, high views, high booking frequency
  private async computePopularityScores(): Promise<Record<number, number>> {
    const listings = await prisma.listing.findMany({
      where: { status: ListingStatus.PUBLISHED, deletedAt: null },
      select: { id: true, viewCount: true, reviews: { select: { rating: true } } },
      take: 500,
    })

    const maxViews = Math.max(...listings.map((l) => l.viewCount), 1)

    const scores: Record<number, number> = {}
    for (const l of listings) {
      const avgRating = l.reviews.length ? l.reviews.reduce((s, r) => s + r.rating, 0) / l.reviews.length : 0
      const normalizedViews = l.viewCount / maxViews
      const ratingScore = avgRating / 5
      scores[l.id] = 0.6 * ratingScore + 0.4 * normalizedViews
    }
    return scores
  }

  // Default: trending/popular listings for new users
  async getDefaultRecommendations(limit = 12): Promise<any[]> {
    const listings = await prisma.listing.findMany({
      where: { status: ListingStatus.PUBLISHED, deletedAt: null },
      orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        amenities: { include: { amenity: true } },
        reviews: { select: { rating: true } },
        landlord: { select: { id: true, fullName: true } },
      },
    })

    return listings.map((l) => ({
      ...l,
      avgRating: l.reviews.length ? l.reviews.reduce((s, r) => s + r.rating, 0) / l.reviews.length : null,
    }))
  }

  // Track user behavior
  async trackBehavior(userId: number, listingId: number, behaviorType: string, extra?: { keyword?: string; duration?: number }) {
    return prisma.userBehavior.create({
      data: {
        userId,
        listingId,
        behaviorType: behaviorType as any,
        searchKeyword: extra?.keyword,
        duration: extra?.duration,
      },
    })
  }
}

export const recommendationService = new RecommendationService()
