import { Button } from '@/components/ui/button'
import {
  formatReviewCount,
  getRatingPercentage,
  REVIEW_STROKE_LENGTH,
} from '@/lib/reviews/review-formatters'
import type { RatingReviewsHeaderProps } from '@/types/RatingReviewTypes'

export function RatingReviewsHeader({
  averageRating,
  totalReviews,
  onWriteReview,
  labels,
}: RatingReviewsHeaderProps) {
  const ratingPercentage = getRatingPercentage(averageRating)

  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
      <div className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg className="h-full w-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              className="stroke-secondary"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              className="stroke-accent"
              strokeWidth="6"
              fill="none"
              strokeDasharray={REVIEW_STROKE_LENGTH}
              strokeDashoffset={
                REVIEW_STROKE_LENGTH -
                REVIEW_STROKE_LENGTH * (ratingPercentage / 100)
              }
              strokeLinecap="round"
            />
          </svg>
          <span className="text-accent absolute text-xl font-bold">
            {averageRating.toFixed(1)}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-lg font-medium text-white md:text-[24px]">
            {labels?.outOf5 ?? 'Out of 5'}
          </span>
          <span className="text-muted-foreground text-base font-medium md:text-[20px]">
            {(labels?.basedOnReviews ?? 'based on {count} reviews').replace(
              '{count}',
              formatReviewCount(totalReviews),
            )}
          </span>
        </div>
      </div>

      <Button className="px-4 py-6" variant="outline" onClick={onWriteReview}>
        {labels?.writeAReview ?? 'Write a Review'}
      </Button>
    </div>
  )
}
