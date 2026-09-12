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
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
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
