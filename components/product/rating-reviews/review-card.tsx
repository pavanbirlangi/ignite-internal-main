import Image from 'next/image'
import { formatReviewDate } from '@/lib/reviews/review-formatters'
import type { ReviewCardProps } from '@/types/RatingReviewTypes'
import { StarRating } from './star-rating'
import { getProxyImageUrl } from '@/lib/utils'

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <article className="bg-card border-border flex h-full flex-col gap-3 rounded-[14px] border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {review.profile_photo ? (
            <div className="relative size-9 shrink-0 overflow-hidden rounded-full">
              <Image
                src={getProxyImageUrl(review.profile_photo)}
                alt=""
                fill
                className="object-cover"
                sizes="36px"
              />
            </div>
          ) : (
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold text-white/95">
              {(review.name?.trim()[0] ?? '?').toUpperCase()}
            </div>
          )}
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-white/95">{review.name}</span>
            <span className="text-xs text-white/65">{formatReviewDate(review.createdAt)}</span>
          </div>
        </div>
        <StarRating rating={review.rating} size={14} />
      </div>

      <p className="text-sm leading-[22px] whitespace-pre-line text-white/65">{review.body}</p>
      {review.verified === 'verified-purchase' ? (
        <span className="mt-auto text-xs font-medium text-[#7DB0FF]">Verified purchase</span>
      ) : null}
    </article>
  )
}
