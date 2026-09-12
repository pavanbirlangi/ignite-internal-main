import Image from 'next/image'
import { User } from 'lucide-react'
import { formatReviewDate } from '@/lib/reviews/review-formatters'
import type { ReviewCardProps } from '@/types/RatingReviewTypes'
import { StarRating } from './star-rating'
import { getProxyImageUrl } from '@/lib/utils'

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-secondary flex h-full flex-col rounded-2xl border border-white/5 p-5 md:min-h-55">
      <div className="mb-4 flex flex-col items-start justify-between gap-3 md:flex-row">
        <div className="flex items-center gap-3">
          {review.profile_photo ? (
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/10 shrink-0">
              <Image
                src={getProxyImageUrl(review.profile_photo)}
                alt={`${review.name}'s profile photo`}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
          ) : (
            <div className="bg-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <User className="text-white" size={24} />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-[16px] font-medium text-white">
              {review.name}
            </span>
            <span className="text-muted-foreground text-xs font-medium">
              {formatReviewDate(review.createdAt)}
            </span>
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {/* <h3 className="text-sm font-semibold text-white">{review.title}</h3> */}
        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
          {review.body}
        </p>
        {review.verified === 'verified-purchase' ? (
          <span className="text-primary text-xs font-medium">
            Verified purchase
          </span>
        ) : null}
      </div>
    </div>
  )
}
