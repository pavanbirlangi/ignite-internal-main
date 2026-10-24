import React, { useEffect, useRef } from 'react'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { authService, SOCIAL_PROVIDER_LABELS, type SocialProvider } from '@/lib/services/auth.service'
import { useUserStore } from '@/store/useUserStore'
import { useCartStore } from '@/store/useCartStore'
import { useAuthModalStore } from '@/store/useAuthModalStore'
import { OAUTH_RETURN_KEY } from '@/lib/auth/oauth-return'

import GoogleIcon from '../icons/GoogleIcon'
import FacebookIcon from '../icons/FacebookIcon'
import DiscordIcon from '../icons/DiscordIcon'
import AppleIcon from '../icons/AppleIcon'

// Dark tiles with the brand's own icon colour, so the three providers sit
// quietly above the form instead of competing with the Log in button. The
// label hides on narrow phones, leaving the icon.
function SocialButton({
  icon,
  label,
  className,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  className?: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Continue with ${label}`}
      className={cn(
        'border-border flex h-11 min-w-0 cursor-pointer items-center justify-center gap-2 rounded-lg border bg-white/5 text-sm font-medium text-white/95 transition-colors hover:border-white/20 hover:bg-white/10 active:bg-white/5',
        className,
      )}
    >
      {icon}
      <span className="truncate max-[420px]:hidden">{label}</span>
    </button>
  )
}

export function SocialButtons() {
  const handledRef = useRef(false)

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'OAUTH_SUCCESS' && event.data?.type !== 'OAUTH_ERROR') return
      if (handledRef.current) return
      handledRef.current = true

      if (event.data.type === 'OAUTH_ERROR') {
        toast.error(event.data.payload?.message || 'Sign-in failed')
        handledRef.current = false
        return
      }

      const { accessToken, expiresAt } = event.data.payload || {}
      if (!accessToken) {
        toast.error('Sign-in failed')
        handledRef.current = false
        return
      }

      Cookies.set('access_token', accessToken, {
        expires: expiresAt ? new Date(expiresAt) : 7,
        path: '/',
      })
      useUserStore.getState().setIsAuthenticated(true)

      useCartStore
        .getState()
        .transferGuestCartToUser()
        .catch((cartError) => {
          console.error('Failed to transfer cart after social login', cartError)
        })
        .finally(() => {
          toast.success('Login successful')
          useAuthModalStore.getState().closeModal()
          handledRef.current = false
        })
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // R-03: Google, Discord and Facebook all use the same popup (or whole-tab redirect on phones).
  const handleSocialLogin = async (provider: SocialProvider) => {
    const label = SOCIAL_PROVIDER_LABELS[provider]
    const width = Math.min(500, window.outerWidth - 20)
    const height = Math.min(600, window.outerHeight - 20)
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2)
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2)

    // Opened on the tap itself: phone browsers block a popup opened after an await. It gets
    // the provider's address once the backend replies.
    const popup = window.open('', `${provider}-oauth`, `width=${width},height=${height},left=${left},top=${top}`)
    try {
      // If the popup is blocked the whole tab goes to the provider; the callback comes back here.
      sessionStorage.setItem(OAUTH_RETURN_KEY, window.location.pathname + window.location.search)
    } catch {
      // Storage blocked: the callback falls back to the home page.
    }

    try {
      const callbackUrl = `${window.location.origin}/api/auth/${provider}/callback`
      const { location } = await authService.socialAuthInit(provider, callbackUrl)
      if (popup && !popup.closed) popup.location.href = location
      else window.location.href = location
    } catch (err) {
      popup?.close()
      console.error(`Failed to start ${label} login:`, err)
      toast.error(`Could not start ${label} sign-in. Please try again.`)
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2.5">
      <SocialButton
        label="Google"
        icon={<GoogleIcon className="size-[18px] shrink-0" />}
        onClick={() => handleSocialLogin('google')}
      />
      <SocialButton
        label="Facebook"
        icon={<FacebookIcon className="size-[22px] shrink-0 text-(--facebook-blue)" />}
        onClick={() => handleSocialLogin('facebook')}
      />
      <SocialButton
        label="Discord"
        // The Discord glyph has a lot of padding in its viewBox.
        icon={<DiscordIcon className="-m-1.5 size-[30px] shrink-0 text-(--discord-blue)" />}
        onClick={() => handleSocialLogin('discord')}
      />
      {/* <SocialButton
        icon={<AppleIcon className="size-8 text-white/95" />}
        className="bg-background hover:bg-white/10 transition-colors"
      /> */}
    </div>
  )
}
