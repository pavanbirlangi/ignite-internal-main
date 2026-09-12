import React from 'react'

const ProductSkeleton = () => {
  return (
    <div className="group bg-secondary/20 relative flex h-full w-full animate-pulse flex-col overflow-hidden rounded-2xl border border-transparent">
      {/* Image Skeleton */}
      <div className="relative aspect-square w-full bg-[var(--neutral-850)] sm:aspect-3/4"></div>

      {/* Details Section */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div className="flex flex-col gap-2">
          {/* Title Skeleton */}
          <div className="bg-border h-4 w-3/4 rounded-md"></div>
          <div className="bg-border h-4 w-1/2 rounded-md"></div>

          {/* Price Skeleton */}
          <div className="bg-border mt-2 h-5 w-1/3 rounded-md"></div>
        </div>
      </div>

      {/* Buttons Skeleton */}
      <div className="rounded-b-2xl px-2 pt-0 pb-3">
        <div className="border-border mt-auto flex flex-col items-center gap-2 border-t pt-2 sm:flex-row sm:gap-4">
          <div className="bg-border h-[34px] w-full flex-1 rounded-[6px]"></div>
          <div className="bg-border h-[34px] w-full flex-1 rounded-[6px]"></div>
        </div>
      </div>
    </div>
  )
}

export default ProductSkeleton
