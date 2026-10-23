'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { formatReviewDate } from '@/lib/reviews/review-formatters'
import type { ReviewCardProps } from '@/types/RatingReviewTypes'
import { StarRating } from './star-rating'
import { getProxyImageUrl } from '@/lib/utils'

export function ReviewCard({ review, labels }: ReviewCardProps) {
  const bodyRef = useRef<HTMLParagraphElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)

  // Long reviews show 4 lines first; "Read more" only appears when the text is actually cut.
  useLayoutEffect(() => {
    const el = bodyRef.current
    if (el && !isExpanded) setIsClamped(el.scrollHeight > el.clientHeight + 1)
  }, [review.body, isExpanded])

  return (
    <article className="bg-card border-border flex flex-col gap-3 rounded-[14px] border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
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
            <span className="text-xs whitespace-nowrap text-white/65">
              {formatReviewDate(review.createdAt)}
              {review.verified === 'verified-purchase' ? (
                <>
                  <span className="mx-1.5" aria-hidden>
                    ·
                  </span>
                  <span className="text-white/95">{labels?.verifiedPurchase ?? 'Verified purchase'}</span>
                </>
              ) : null}
            </span>
          </div>
        </div>
        <StarRating rating={review.rating} size={14} />
      </div>

      <div>
        <p
          ref={bodyRef}
          className={`text-sm leading-[22px] whitespace-pre-line text-white/65 ${isExpanded ? '' : 'line-clamp-4'}`}
        >
          {review.body}
        </p>
        {isClamped && !isExpanded ? (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="mt-1 cursor-pointer text-sm font-medium text-white/95 transition-colors hover:text-white/65"
          >
            {labels?.readMore ?? 'Read more'}
          </button>
        ) : null}
      </div>

      {review.responseBody ? (
        <div className="border-primary bg-primary/8 rounded-r-[10px] border-l-2 px-3 py-2.5">
          <p className="mb-0.5 text-xs font-medium text-white/95">{labels?.storeReply ?? 'Reply from Increddy'}</p>
          <p className="text-sm leading-[22px] whitespace-pre-line text-white/65">{review.responseBody}</p>
        </div>
      ) : null}
    </article>
  )
}
