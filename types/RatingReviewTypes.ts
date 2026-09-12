import type { Product } from '@/types/product'
import type { ProductReview } from '@/types/review'

export interface RatingReviewsProps {
  product: Product
}

export interface RatingReviewsHeaderProps {
  averageRating: number
  totalReviews: number
  onWriteReview: () => void
  labels?: {
    outOf5?: string
    basedOnReviews?: string
    writeAReview?: string
  }
}

export interface StarRatingProps {
  rating: number
}

export interface ReviewCardProps {
  review: ProductReview
}
