'use client'

import { useEffect, useRef, Suspense } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import Cookies from 'js-cookie'
import { useUserStore } from '@/store/useUserStore'
import { useCartStore } from '@/store/useCartStore'

function OAuthCallbackLogic() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const fetchUser = useUserStore((s) => s.fetchUser)
  
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return

    const sessionAccessToken = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
    const sessionExpiresAt = typeof window !== 'undefined' ? sessionStorage.getItem('expiresAt') : null;

    const accessToken = sessionAccessToken || searchParams.get('accessToken')
    const expiresAt = sessionExpiresAt || searchParams.get('expiresAt')

    if (!accessToken) return

    handled.current = true

    // 1. Save token to cookie
    const cookieOps: Cookies.CookieAttributes = {
      path: '/',
      expires: expiresAt ? new Date(expiresAt) : 7,
    }
    Cookies.set('access_token', accessToken, cookieOps)

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('accessToken')
      sessionStorage.removeItem('expiresAt')
    }

    // 2. Clean up URL immediately so the token doesn't linger
    const cleanParams = new URLSearchParams(searchParams.toString())
    cleanParams.delete('accessToken')
    cleanParams.delete('expiresAt')
    const cleanQuery = cleanParams.toString()
    const cleanUrl = `${pathname}${cleanQuery ? `?${cleanQuery}` : ''}`
    
    // Use window.history so it happens synchronously and doesn't depend on React lifecycle
    window.history.replaceState(window.history.state, '', cleanUrl)

    // 3. Fetch user profile with the new token
    fetchUser()
      .then(async () => {
        console.log('[OAuth] User fetched successfully after social login')
        // Transfer guest cart to user if applicable
        try {
          await useCartStore.getState().transferGuestCartToUser()
        } catch (cartError) {
          console.error(
            '[OAuth] Failed to transfer cart after social login',
            cartError,
          )
        }
      })
      .catch((err: unknown) => {
        console.error('[OAuth] Failed to fetch user after social login:', err)
      })

  }, [searchParams, pathname, fetchUser])

  return null
}

export function OAuthCallbackHandler() {
  return (
    <Suspense fallback={null}>
      <OAuthCallbackLogic />
    </Suspense>
  )
}
