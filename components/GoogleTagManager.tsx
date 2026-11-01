'use client'

import Script from 'next/script'
import { CONSENT_MAX_AGE_MS, CONSENT_REGIONS, CONSENT_STORAGE_KEY } from '@/lib/consent'

declare global {
  interface Window {
    dataLayer: unknown[]
  }
}

// Google Tag Manager loads GA4 (G-X4GZ2JSESD), the Google Ads conversion linker and the Ads
// purchase conversion; which tag fires on what is set up in the container, the site only pushes
// events (lib/analytics.ts). afterInteractive rather than lazyOnload: the conversion linker has to
// read the ad click (?gclid=) on the landing page, before a quick visitor moves on.
// Consent Mode v2 defaults come first, in the same script (lib/consent.ts): denied in the EU/EEA,
// UK and Switzerland, granted elsewhere, then the visitor's saved choice on top.
export default function GoogleTagManager({ gtmId }: { gtmId: string }) {
  if (!gtmId) return null

  return (
    <Script id="google-tag-manager" strategy="afterInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){ window.dataLayer.push(arguments); }
        gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', region: ${JSON.stringify(CONSENT_REGIONS)}, wait_for_update: 500 });
        gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' });
        gtag('set', 'ads_data_redaction', true);
        try {
          var saved = JSON.parse(localStorage.getItem('${CONSENT_STORAGE_KEY}') || 'null');
          if (saved && saved.at && Date.now() - saved.at < ${CONSENT_MAX_AGE_MS}) {
            var ad = saved.ads ? 'granted' : 'denied';
            gtag('consent', 'update', { analytics_storage: saved.analytics ? 'granted' : 'denied', ad_storage: ad, ad_user_data: ad, ad_personalization: ad });
          }
        } catch (e) {}
        window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtm.js?id=${gtmId}';
        document.head.appendChild(s);
      `}
    </Script>
  )
}
