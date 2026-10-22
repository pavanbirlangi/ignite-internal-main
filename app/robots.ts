import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Private and transactional pages, with and without a language prefix (/fr/checkout). "$" ends a
// rule exactly at the page, so a product whose handle starts with the same word (e.g. a
// "cart..." game) isn't blocked by accident.
const PRIVATE = ['dashboard', 'checkout', 'cart', 'order', 'account', 'auth']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          ...PRIVATE.flatMap((page) => [`/${page}$`, `/${page}/`, `/*/${page}$`, `/*/${page}/`]),
          // Tracking parameters create duplicate URLs of the same page.
          '/*?utm_',
          '/*&utm_',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
