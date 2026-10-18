import { Star } from 'lucide-react'
import type { StarRatingProps } from '@/types/RatingReviewTypes'

export function StarRating({ rating, size = 16 }: StarRatingProps) {
  return (
    <div className="text-accent flex gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          aria-hidden
          className={star <= Math.round(rating) ? 'fill-current' : 'text-white/20'}
        />
      ))}
    </div>
  )
}
