export interface ProductReview {
  id: string
  name: string
  rating: number
  title: string
  body: string
  createdAt?: string
  // Kept as the magic string the existing UI already checks for
  // (`review.verified === 'verified-purchase'`), rather than a boolean, so
  // review-card.tsx needed zero changes.
  verified?: string
  // Medusa's review model has no concept of a reviewer-uploaded photo --
  // always undefined, kept only so review-card.tsx's existing fallback-icon
  // ternary compiles unchanged.
  profile_photo?: string
  responseBody?: string | null
}

export interface ProductReviewSummary {
  averageRating: number
  totalReviews: number
}

export interface ProductReviewsResponse {
  reviews: ProductReview[]
  summary: ProductReviewSummary
  page: number
  perPage: number
  total: number
  totalPages: number
  hasNextPage: boolean
}

export interface GetReviewsParams {
  productId: string
  page?: number
  perPage?: number
}

export interface SubmitReviewPayload {
  productId: string
  orderId: string
  rating: number
  title?: string
  body: string
}

export interface EligibleReviewOrder {
  id: string
  displayId: number
  createdAt: string
}
