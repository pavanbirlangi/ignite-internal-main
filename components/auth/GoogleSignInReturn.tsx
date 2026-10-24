'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { completeSignIn } from '@/lib/auth/complete-sign-in'
import { useAuthModalStore } from '@/store/useAuthModalStore'
import { OAUTH_CHANNEL, OAUTH_RESULT_KEY } from '@/lib/auth/oauth-return'

type OAuthResult = { type: 'OAUTH_SUCCESS' | 'OAUTH_ERROR'; payload?: Record<string, unknown> }

let handling = false

async function finish(result: OAuthResult | null) {
  if (!result || handling) return
  handling = true
  try {
    const accessToken = result.payload?.accessToken
    if (result.type !== 'OAUTH_SUCCESS' || typeof accessToken !== 'string') {
      toast.error(String(result.payload?.message || 'Sign-in failed'))
      return
    }
    const expiresAt =
      typeof result.payload?.expiresAt === 'string'
        ? result.payload.expiresAt
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await completeSignIn({ token: { accessToken, expiresAt } })
    useAuthModalStore.getState().closeModal()
    toast.success('Login successful')
  } finally {
    handling = false
  }
}

// Mounted once in the layout: finishes a Google sign-in that came back without a popup (phones
// block the popup, or the popup tab loses its opener on the way through Google), either
// on this page load (full redirect) or from the other tab (a popup tab with no opener).
export default function GoogleSignInReturn() {
  useEffect(() => {
    // A tick later, so the toaster is listening before a toast is raised.
    const timer = window.setTimeout(() => {
      try {
        const stored = sessionStorage.getItem(OAUTH_RESULT_KEY)
        if (stored) {
          sessionStorage.removeItem(OAUTH_RESULT_KEY)
          finish(JSON.parse(stored) as OAuthResult)
        }
      } catch {
        // Storage blocked (private mode on some browsers): nothing was left here.
      }
    }, 0)

    const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(OAUTH_CHANNEL)
    if (channel) channel.onmessage = (event) => finish(event.data as OAuthResult)
    return () => {
      window.clearTimeout(timer)
      channel?.close()
    }
  }, [])

  return null
}
