'use client'

import { createContext, useContext } from 'react'

const FALLBACK_LOGO = '/images/common/logo.svg'

const SiteLogoContext = createContext<string>(FALLBACK_LOGO)

// The site logo uploaded in Directus (navbar.logo), for every header that shows it: the main
// header, the phone menu and the Cart -> Checkout -> Redeem header. The bundled SVG is used when
// Directus has none.
export function SiteLogoProvider({ logoId, children }: { logoId?: string | null; children: React.ReactNode }) {
  const src = logoId ? `${process.env.NEXT_PUBLIC_CMS_API_URL}/assets/${logoId}` : FALLBACK_LOGO
  return <SiteLogoContext.Provider value={src}>{children}</SiteLogoContext.Provider>
}

export const useSiteLogo = () => useContext(SiteLogoContext)
