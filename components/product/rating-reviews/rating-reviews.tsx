'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, PenLine } from 'lucide-react'
import { ReviewModal } from '@/components/shared/ReviewModal'
import { useReviews } from '@/hooks/useReviews'
import type { ProductReview } from '@/types/review'
import type { RatingReviewsProps as BaseRatingReviewsProps } from '@/types/RatingReviewTypes'
import { PRODUCT_CONTAINER_CLASS } from '@/components/product/hero-section/ProductHero'
import { RatingReviewsHeader } from './rating-reviews-header'
import { RatingReviewsSkeleton } from './rating-reviews-skeleton'
import { ReviewCard } from './review-card'
import { ReviewSortMenu, sortReviews, type ReviewSort } from './review-sort-menu'

interface RatingReviewsProps extends BaseRatingReviewsProps {
  labels?: {
    heading?: string
    basedOnOneReview?: string
    basedOnReviews?: string
    writeAReview?: string
    writeFirstReview?: string
    failedToLoad?: string
    noReviews?: string
    loadMore?: string
    loading?: string
    verifiedPurchase?: string
    storeReply?: string
    readMore?: string
    sortBy?: string
    sortMostRecent?: string
    sortOldest?: string
    sortHighestRated?: string
    sortLowestRated?: string
  }
}

const WRITE_BUTTON_CLASS =
  'inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[10px] border border-white/10 bg-white/6 px-4 text-sm font-medium whitespace-nowrap text-white/95 transition-all duration-200 hover:-translate-y-px hover:border-white/20 hover:bg-white/10'

// Shown at a time; "Load more" adds the next batch.
const REVIEWS_PER_STEP = 4
// The backend loads every review of a product for each request anyway (its average covers all of
// them), so one request of up to 100 lets us sort the whole set here. Past 100 the sort covers what's loaded.
const REVIEWS_PER_REQUEST = 100
// Sorting one or two reviews changes nothing.
const MIN_REVIEWS_FOR_SORT = 3

export default function RatingReviews({ product, labels }: RatingReviewsProps) {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [sort, setSort] = useState<ReviewSort>('recent')
  const [visibleCount, setVisibleCount] = useState(REVIEWS_PER_STEP)
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useReviews({
    productId: product.id,
    perPage: REVIEWS_PER_REQUEST,
  })

  const pages = data?.pages
  const reviews = useMemo(() => (pages ?? []).flatMap((page) => page.reviews), [pages])
  const sortedReviews = useMemo(() => sortReviews(reviews, sort), [reviews, sort])
  const visibleReviews = sortedReviews.slice(0, visibleCount)
  const canLoadMore = visibleCount < reviews.length || Boolean(hasNextPage)
  const loadMore = () => {
    if (visibleCount + REVIEWS_PER_STEP > reviews.length && hasNextPage) fetchNextPage()
    setVisibleCount((count) => count + REVIEWS_PER_STEP)
  }
  const changeSort = (next: ReviewSort) => {
    setSort(next)
    setVisibleCount(REVIEWS_PER_STEP)
  }
  const averageRating = pages?.[0]?.summary.averageRating ?? 0
  const totalReviews = pages?.[0]?.summary.totalReviews ?? 0
  const writeButton = (label: string) => (
    <button type="button" className={WRITE_BUTTON_CLASS} onClick={() => setIsReviewModalOpen(true)}>
      <PenLine className="size-4" aria-hidden />
      {label}
    </button>
  )
  const hasReviews = !isLoading && !isError && reviews.length > 0

  return (
    <section id="reviews" className={`${PRODUCT_CONTAINER_CLASS} scroll-mt-28`}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <h2 className="text-xl leading-[26px] font-bold text-white/95 md:text-2xl md:leading-[30px]">
          {labels?.heading ?? 'Ratings & reviews'}
        </h2>
        {hasReviews && (
          <div className="flex items-center gap-2.5">
            {reviews.length >= MIN_REVIEWS_FOR_SORT && (
              <ReviewSortMenu
                value={sort}
                onChange={changeSort}
                label={labels?.sortBy ?? 'Sort by'}
                optionLabels={{
                  recent: labels?.sortMostRecent ?? 'Most recent',
                  oldest: labels?.sortOldest ?? 'Oldest',
                  highest: labels?.sortHighestRated ?? 'Highest rated',
                  lowest: labels?.sortLowestRated ?? 'Lowest rated',
                }}
              />
            )}
            {writeButton(labels?.writeAReview ?? 'Write a review')}
          </div>
        )}
      </div>

      {isLoading ? (
        <RatingReviewsSkeleton />
      ) : isError || reviews.length === 0 ? (
        <div className="flex flex-col items-start justify-between gap-4 rounded-[14px] border border-dashed border-white/14 px-5.5 py-5 text-sm text-white/65 sm:flex-row sm:items-center">
          <span>{isError ? (labels?.failedToLoad ?? 'Failed to load reviews.') : (labels?.noReviews ?? 'No reviews yet for this product.')}</span>
          {!isError && writeButton(labels?.writeFirstReview ?? 'Write the first review')}
        </div>
      ) : (
        <>
          <RatingReviewsHeader
            averageRating={averageRating}
            totalReviews={totalReviews}
            labels={{ basedOnOneReview: labels?.basedOnOneReview, basedOnReviews: labels?.basedOnReviews }}
          />
          <div className="mt-5 grid items-start gap-3.5 md:grid-cols-2">
            {visibleReviews.map((review: ProductReview) => (
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
          {canLoadMore ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
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
