import { Star } from 'lucide-react'
import type { StarRatingProps } from '@/types/RatingReviewTypes'

export function StarRating({ rating }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={20}
          className={star <= rating ? 'fill-accent text-accent' : 'text-accent'}
        />
      ))}
    </div>
  )
}
