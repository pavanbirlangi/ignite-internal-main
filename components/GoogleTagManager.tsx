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
// Google tag gateway (set up 2026-11-02 in Tag Manager with Cloudflare): Cloudflare serves the
// container from our own domain at this path and passes its data on to Google, so ad blockers and
// Safari's tracking protection drop less of it. Google's own address is the fallback if the path
// ever stops answering (gateway switched off).
// While the gateway is on, Cloudflare adds its own loader to every page (google_tags_first_party +
// /yfg1/, even with "Set up tag" off), so the container is only loaded here when that loader isn't
// on the page, or as a fallback when the container hasn't started a few seconds later; loading it
// twice cost phones ~180 KB of JavaScript per page.
const GATEWAY_PATH = 'yfg1'
const FALLBACK_AFTER_MS = 4000

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
        var loadFromGoogle = function () {
          if (window.google_tag_manager && window.google_tag_manager['${gtmId}']) return;
          var f = document.createElement('script');
          f.async = true;
          f.src = 'https://www.googletagmanager.com/gtm.js?id=${gtmId}';
          document.head.appendChild(f);
        };
        var gatewayLoader = (window.google_tags_first_party || []).indexOf('${gtmId}') !== -1;
        if (gatewayLoader) {
          setTimeout(loadFromGoogle, ${FALLBACK_AFTER_MS});
        } else {
          var s = document.createElement('script');
          s.async = true;
          s.src = '/${GATEWAY_PATH}/?id=${gtmId}';
          s.onerror = loadFromGoogle;
          document.head.appendChild(s);
        }
      `}
    </Script>
  )
}
