import { ReviewCardSkeleton } from './review-card-skeleton'

export function RatingReviewsSkeleton() {
  return (
    <>
      <div className="flex items-center gap-3.5">
        <div className="h-9 w-14 animate-pulse rounded bg-white/10" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
        </div>
      </div>

      <div className="mt-5 hidden grid-cols-2 gap-3.5 md:grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <ReviewCardSkeleton key={index} />
        ))}
      </div>

      <div className="mt-5 space-y-3.5 md:hidden">
        {Array.from({ length: 2 }).map((_, index) => (
          <ReviewCardSkeleton key={index} />
        ))}
      </div>
    </>
  )
}
