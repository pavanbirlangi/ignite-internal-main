import { formatReviewCount } from '@/lib/reviews/review-formatters'
import type { RatingReviewsHeaderProps } from '@/types/RatingReviewTypes'
import { StarRating } from './star-rating'

// The average as a number with its stars and how many reviews it comes from.
export function RatingReviewsHeader({ averageRating, totalReviews, labels }: RatingReviewsHeaderProps) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="text-[32px] leading-[38px] font-bold text-white/95">{averageRating.toFixed(1)}</span>
      <div className="flex flex-col gap-1">
        <StarRating rating={averageRating} />
        <span className="text-sm text-white/65">
          {totalReviews === 1
            ? (labels?.basedOnOneReview ?? 'Based on 1 review')
            : (labels?.basedOnReviews ?? 'Based on {count} reviews').replace('{count}', formatReviewCount(totalReviews))}
        </span>
      </div>
    </div>
  )
}
