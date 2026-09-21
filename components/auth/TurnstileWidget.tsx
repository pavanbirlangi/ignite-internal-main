'use client'

import Script from 'next/script'
import { useCallback, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: Record<string, unknown>,
      ) => string
      reset: (widgetId?: string) => void
    }
  }
}

// Public by design -- Turnstile site keys (like reCAPTCHA site keys) are
// meant to be embedded client-side; the secret half lives server-side only,
// wherever verification actually happens (not yet built -- see
// MEDUSA_MIGRATION_BACKEND_REQUIREMENTS.md). Renders nothing at all when
// unset, so registration keeps working exactly as before until a real site
// key is configured.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export function TurnstileWidget({
  onVerify,
}: {
  onVerify: (token: string | null) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const renderWidget = useCallback(() => {
    if (!SITE_KEY || !containerRef.current || !window.turnstile) return
    window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      theme: 'dark',
      callback: (token: string) => onVerify(token),
      'expired-callback': () => onVerify(null),
      'error-callback': () => onVerify(null),
    })
  }, [onVerify])

  if (!SITE_KEY) return null

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div ref={containerRef} className="flex justify-center" />
    </>
  )
}
