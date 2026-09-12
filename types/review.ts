export interface ProductReview {
  id: string
  name: string
  email?: string
  rating: number
  title: string
  body: string
  createdAt?: string
  verified?: string
  source?: string
  helpfulCount?: number
  productTitle?: string
  productHandle?: string
  profile_photo?: string
  pictures?: string[]
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
  handle?: string
  productId?: string
  page?: number
  perPage?: number
  rating?: number
}

export interface SubmitReviewPayload {
  handle: string
  productHandle?: string
  id?: string
  productId?: string
  name: string
  email: string
  rating: number
  title: string
  body: string
}

export interface SubmitReviewResponse {
  message?: string
  success?: boolean
}
