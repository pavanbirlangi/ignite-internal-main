import type { Product } from '@/types/product'
import type { ProductReview } from '@/types/review'

export interface RatingReviewsProps {
  product: Product
}

export interface RatingReviewsHeaderProps {
  averageRating: number
  totalReviews: number
  labels?: {
    basedOnOneReview?: string
    basedOnReviews?: string
  }
}

export interface StarRatingProps {
  rating: number
  size?: number
}

export interface ReviewCardProps {
  review: ProductReview
  labels?: {
    verifiedPurchase?: string
    storeReply?: string
    readMore?: string
  }
}
