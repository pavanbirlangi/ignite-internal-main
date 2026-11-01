'use client'

import Script from 'next/script'

declare global {
  interface Window {
    dataLayer: unknown[]
  }
}

// Google Tag Manager loads GA4 (G-X4GZ2JSESD), the Google Ads conversion linker and the Ads
// purchase conversion; which tag fires on what is set up in the container, the site only pushes
// events (lib/analytics.ts). afterInteractive rather than lazyOnload: the conversion linker has to
// read the ad click (?gclid=) on the landing page, before a quick visitor moves on.
export default function GoogleTagManager({ gtmId }: { gtmId: string }) {
  if (!gtmId) return null

  return (
    <Script id="google-tag-manager" strategy="afterInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtm.js?id=${gtmId}';
        document.head.appendChild(s);
      `}
    </Script>
  )
}
