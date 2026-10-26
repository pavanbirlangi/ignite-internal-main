'use client'

import { Suspense, useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Script from 'next/script'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

function GoogleAnalyticsPageViews({
  gaId,
  ready,
}: {
  gaId: string
  ready: boolean
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!ready || !gaId || typeof window.gtag !== 'function') return

    const url = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname

    window.gtag('config', gaId, { page_path: url })
  }, [gaId, pathname, ready, searchParams])

  return null
}

export default function GoogleAnalytics({ gaId }: { gaId: string }) {
  const [ready, setReady] = useState(false)

  if (!gaId) return null

  return (
    <>
      {/* lazyOnload: the 180 KB tag waits until the page has loaded, so it doesn't compete with
          the hero image and the page's own scripts (it cost Lighthouse ~130 ms of main thread).
          Page views are still sent once it's ready. */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="lazyOnload"
      />
      <Script
        id="google-analytics"
        strategy="lazyOnload"
        onReady={() => setReady(true)}
      >
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${gaId}', { send_page_view: false });
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsPageViews gaId={gaId} ready={ready} />
      </Suspense>
    </>
  )
}
