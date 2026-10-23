'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ReviewModal } from '@/components/shared/ReviewModal'
import { useReviews } from '@/hooks/useReviews'
import type { ProductReview } from '@/types/review'
import type { RatingReviewsProps as BaseRatingReviewsProps } from '@/types/RatingReviewTypes'
import { PRODUCT_CONTAINER_CLASS } from '@/components/product/hero-section/ProductHero'
import { RatingReviewsHeader } from './rating-reviews-header'
import { RatingReviewsSkeleton } from './rating-reviews-skeleton'
import { ReviewCard } from './review-card'

interface RatingReviewsProps extends BaseRatingReviewsProps {
  labels?: {
    heading?: string
    basedOnOneReview?: string
    basedOnReviews?: string
    writeAReview?: string
    failedToLoad?: string
    noReviews?: string
    loadMore?: string
    loading?: string
    verifiedPurchase?: string
    storeReply?: string
    readMore?: string
  }
}

const WRITE_BUTTON_CLASS =
  'inline-flex h-10 shrink-0 cursor-pointer items-center rounded-[10px] border border-white/10 bg-white/6 px-4 text-sm font-medium whitespace-nowrap text-white/95 transition-all duration-200 hover:-translate-y-px hover:border-white/20 hover:bg-white/10'

export default function RatingReviews({ product, labels }: RatingReviewsProps) {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useReviews({
    productId: product.id,
    perPage: 4,
  })

  const pages = data?.pages ?? []
  const reviews = pages.flatMap((page) => page.reviews)
  const averageRating = pages[0]?.summary.averageRating ?? 0
  const totalReviews = pages[0]?.summary.totalReviews ?? 0
  const writeLabel = labels?.writeAReview ?? 'Write a review'
  const writeButton = (
    <button type="button" className={WRITE_BUTTON_CLASS} onClick={() => setIsReviewModalOpen(true)}>
      {writeLabel}
    </button>
  )
  const hasReviews = !isLoading && !isError && reviews.length > 0

  return (
    <section id="reviews" className={`${PRODUCT_CONTAINER_CLASS} scroll-mt-28`}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-xl leading-[26px] font-bold text-white/95 md:text-2xl md:leading-[30px]">
          {labels?.heading ?? 'Ratings & reviews'}
        </h2>
        {hasReviews && writeButton}
      </div>

      {isLoading ? (
        <RatingReviewsSkeleton />
      ) : isError || reviews.length === 0 ? (
        <div className="flex flex-col items-start justify-between gap-4 rounded-[14px] border border-dashed border-white/14 px-5.5 py-5 text-sm text-white/65 sm:flex-row sm:items-center">
          <span>{isError ? (labels?.failedToLoad ?? 'Failed to load reviews.') : (labels?.noReviews ?? 'No reviews yet for this product.')}</span>
          {!isError && writeButton}
        </div>
      ) : (
        <>
          <RatingReviewsHeader
            averageRating={averageRating}
            totalReviews={totalReviews}
            labels={{ basedOnOneReview: labels?.basedOnOneReview, basedOnReviews: labels?.basedOnReviews }}
          />
          <div className="mt-5 grid items-start gap-3.5 md:grid-cols-2">
            {reviews.map((review: ProductReview) => (
              <ReviewCard
                key={review.id}
                review={review}
                labels={{
                  verifiedPurchase: labels?.verifiedPurchase,
                  storeReply: labels?.storeReply,
                  readMore: labels?.readMore,
                }}
              />
            ))}
          </div>
          {hasNextPage ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-white/95 transition-colors hover:text-white/65 disabled:opacity-50"
              >
                {isFetchingNextPage ? (labels?.loading ?? 'Loading...') : (labels?.loadMore ?? 'Load more reviews')}
                <ChevronDown className="size-4" />
              </button>
            </div>
          ) : null}
        </>
      )}

      <ReviewModal
        open={isReviewModalOpen}
        onOpenChange={setIsReviewModalOpen}
        product={product}
        onSubmitted={refetch}
      />
    </section>
  )
}
