import { ReviewCardSkeleton } from './review-card-skeleton'

export function RatingReviewsSkeleton() {
  return (
    <>
      <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-white/10" />
          <div className="flex flex-col gap-2">
            <div className="h-6 w-28 animate-pulse rounded bg-white/10" />
            <div className="h-5 w-40 animate-pulse rounded bg-white/10" />
          </div>
        </div>

        <div className="h-10 w-36 animate-pulse rounded-md bg-white/10" />
      </div>

      <div className="hidden grid-cols-2 gap-4 md:grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <ReviewCardSkeleton key={index} />
        ))}
      </div>

      <div className="space-y-4 md:hidden">
        {Array.from({ length: 2 }).map((_, index) => (
          <ReviewCardSkeleton key={index} />
        ))}
      </div>
    </>
  )
}
