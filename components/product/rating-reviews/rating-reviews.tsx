'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { ReviewModal } from '@/components/shared/ReviewModal'
import { useReviews } from '@/hooks/useReviews'
import type { ProductReview } from '@/types/review'
import type { RatingReviewsProps as BaseRatingReviewsProps } from '@/types/RatingReviewTypes'
import { RatingReviewsHeader } from './rating-reviews-header'
import { RatingReviewsSkeleton } from './rating-reviews-skeleton'
import { ReviewCard } from './review-card'

interface RatingReviewsProps extends BaseRatingReviewsProps {
  labels?: {
    heading?: string
    outOf5?: string
    basedOnReviews?: string
    writeAReview?: string
    failedToLoad?: string
    noReviews?: string
    loadMore?: string
    loading?: string
  }
}

export default function RatingReviews({ product, labels }: RatingReviewsProps) {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReviews({
    handle: product.handle,
    perPage: 4,
  })

  const pages = data?.pages ?? []
  const reviews = pages.flatMap((page) => page.reviews)
  const firstPage = pages[0]
  const averageRating = firstPage?.summary.averageRating ?? 0
  const totalReviews = firstPage?.summary.totalReviews ?? 0

  const openReviewModal = () => setIsReviewModalOpen(true)

  return (
    <div className="max-w-container mx-auto mt-8 mb-10 w-full px-4 md:mt-12 md:mb-20 md:px-0">
      <h2 className="text-muted-foreground mb-6 text-lg font-semibold md:text-[24px]">
        {labels?.heading ?? 'Rating & Reviews'}
      </h2>

      {isLoading ? (
        <RatingReviewsSkeleton />
      ) : (
        <>
          <RatingReviewsHeader
            averageRating={averageRating}
            totalReviews={totalReviews}
            onWriteReview={openReviewModal}
            labels={{
              outOf5: labels?.outOf5,
              basedOnReviews: labels?.basedOnReviews,
              writeAReview: labels?.writeAReview,
            }}
          />

          {isError ? (
            <div className="bg-secondary rounded-2xl border border-white/5 p-6 text-sm text-white">
              {labels?.failedToLoad ?? 'Failed to load reviews.'}
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-secondary rounded-2xl border border-white/5 p-6 text-sm text-white">
              {labels?.noReviews ?? 'No reviews yet for this product.'}
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-2 gap-4 md:grid">
                {reviews.map((review: ProductReview) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>

              <div className="md:hidden">
                <Carousel
                  opts={{
                    align: 'start',
                    loop: reviews.length > 1,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-4">
                    {reviews.map((review: ProductReview) => (
                      <CarouselItem
                        key={review.id}
                        className="basis-[85%] pl-4"
                      >
                        <ReviewCard review={review} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="hidden">
                    <CarouselPrevious />
                    <CarouselNext />
                  </div>
                </Carousel>
              </div>

              {hasNextPage ? (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="hover:text-muted-foreground flex cursor-pointer items-center gap-2 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  >
                    {isFetchingNextPage
                      ? (labels?.loading ?? 'Loading...')
                      : (labels?.loadMore ?? 'Load more reviews')}
                    <ChevronDown size={16} />
                  </button>
                </div>
              ) : null}
            </>
          )}
        </>
      )}

      <ReviewModal
        open={isReviewModalOpen}
        onOpenChange={setIsReviewModalOpen}
        product={product}
        onSubmitted={refetch}
      />
    </div>
  )
}
