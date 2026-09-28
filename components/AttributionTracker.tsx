'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { captureAttributionOnce } from '@/lib/utils/attribution'

function AttributionTrackerInner() {
  const searchParams = useSearchParams()

  useEffect(() => {
    captureAttributionOnce(searchParams)
    // Only ever needs to run once per browser -- captureAttributionOnce is itself a no-op
    // once something is stored, but there's no reason to re-check it on every navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

export default function AttributionTracker() {
  return (
    <Suspense fallback={null}>
      <AttributionTrackerInner />
    </Suspense>
  )
}
