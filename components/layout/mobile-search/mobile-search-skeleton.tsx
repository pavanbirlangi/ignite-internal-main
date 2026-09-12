const SKELETON_COUNT = 3

export function MobileSearchSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <div
          key={index}
          className="bg-secondary/20 flex animate-pulse items-center gap-[24px] rounded-[8px] p-3"
        >
          <div className="h-[79px] w-[62px] shrink-0 rounded-[4px] bg-white/10" />
          <div className="flex flex-1 flex-col gap-4">
            <div className="h-4 w-3/4 rounded bg-white/5" />
            <div className="h-4 w-1/4 rounded bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  )
}
