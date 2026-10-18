'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const HEART_PATH =
  'M12 20.5s-7.5-4.6-9.6-9.3C.9 7.8 3 4 6.6 4c2.1 0 3.7 1.1 5.4 3.1C13.7 5.1 15.3 4 17.4 4 21 4 23.1 7.8 21.6 11.2 19.5 15.9 12 20.5 12 20.5z'
const SPARK_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

interface WishlistHeartProps {
  filled: boolean
  // Heart size in px; the ring and sparks scale with it.
  size?: number
  className?: string
}

// One heart shape for both states. Saving pops it in the wishlist colour with a ring and
// sparks; removing gives it a small squeeze. Nothing animates on first render, and the
// motion is off for reduced-motion users.
export default function WishlistHeart({ filled, size = 20, className }: WishlistHeartProps) {
  const [previous, setPrevious] = useState(filled)
  const [burst, setBurst] = useState<{ key: number; kind: 'pop' | 'squeeze' } | null>(null)

  // A change of `filled` starts the matching animation (state adjusted during render).
  if (previous !== filled) {
    setPrevious(filled)
    setBurst({ key: (burst?.key ?? 0) + 1, kind: filled ? 'pop' : 'squeeze' })
  }

  return (
    <span aria-hidden className={cn('relative inline-grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg
        key={burst?.key}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={cn(
          'overflow-visible',
          burst?.kind === 'pop' && 'motion-safe:animate-heart-pop',
          burst?.kind === 'squeeze' && 'motion-safe:animate-heart-squeeze',
        )}
      >
        <path
          d={HEART_PATH}
          strokeWidth={1.8}
          strokeLinejoin="round"
          className={cn(
            'transition-[fill,stroke] duration-200',
            filled ? 'fill-wishlist stroke-wishlist' : 'fill-transparent stroke-current',
          )}
        />
      </svg>
      {burst?.kind === 'pop' && (
        <span key={burst.key} className="pointer-events-none absolute inset-0">
          <span className="border-wishlist motion-safe:animate-heart-ring absolute inset-0 rounded-full border-2 opacity-0" />
          {SPARK_ANGLES.map((angle) => (
            <span
              key={angle}
              className="bg-wishlist motion-safe:animate-heart-spark absolute top-1/2 left-1/2 -m-0.5 size-1 rounded-full opacity-0"
              style={
                {
                  '--spark-angle': `${angle}deg`,
                  '--spark-distance': `${-size * 1.1}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </span>
      )}
    </span>
  )
}
