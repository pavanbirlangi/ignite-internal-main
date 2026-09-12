export function ReviewCardSkeleton() {
  return (
    <div className="bg-secondary flex h-full flex-col rounded-2xl border border-white/5 p-5 md:min-h-55">
      <div className="mb-4 flex flex-col items-start justify-between gap-3 md:flex-row">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
          </div>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-5 w-5 animate-pulse rounded-full bg-white/10"
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
        <div className="h-3 w-full animate-pulse rounded bg-white/10" />
        <div className="h-3 w-full animate-pulse rounded bg-white/10" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-white/10" />
      </div>
    </div>
  )
}
