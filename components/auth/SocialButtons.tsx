import React, { useEffect, useRef } from 'react'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { authService } from '@/lib/services/auth.service'
import { useUserStore } from '@/store/useUserStore'
import { useCartStore } from '@/store/useCartStore'
import { useAuthModalStore } from '@/store/useAuthModalStore'

import GoogleIcon from '../icons/GoogleIcon'
import FacebookIcon from '../icons/FacebookIcon'
import DiscordIcon from '../icons/DiscordIcon'
import AppleIcon from '../icons/AppleIcon'

function SocialButton({
  icon,
  className,
  onClick,
}: {
  icon: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-18 flex-1 cursor-pointer items-center justify-center rounded-[10px] transition-all hover:scale-105 active:scale-95',
        className,
      )}
    >
      {icon}
    </button>
  )
}

// Discord and Facebook aren't wired up: Medusa has no Discord auth provider at
// all, and Facebook has never had a handler in this design (button already
// renders with no onClick). Waiting on client confirmation before scoping
// either -- see MEDUSA_MIGRATION_BACKEND_REQUIREMENTS.md (R-03).
function handleSocialLoginUnavailable(provider: string) {
  toast.error(`${provider} login isn't available yet`)
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
        toast.error(event.data.payload?.message || 'Google sign-in failed')
        handledRef.current = false
        return
      }

      const { accessToken, expiresAt } = event.data.payload || {}
      if (!accessToken) {
        toast.error('Google sign-in failed')
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
          console.error('Failed to transfer cart after Google login', cartError)
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

  const handleGoogleLogin = async () => {
    try {
      const callbackUrl = `${window.location.origin}/api/auth/google/callback`
      const { location } = await authService.googleAuthInit(callbackUrl)

      const width = Math.min(500, window.outerWidth - 20)
      const height = Math.min(600, window.outerHeight - 20)
      const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2)
      const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2)

      const popup = window.open(
        location,
        'Google OAuth',
        `width=${width},height=${height},left=${left},top=${top}`,
      )

      if (!popup) {
        window.location.href = location
      }
    } catch (err) {
      console.error('Failed to start Google login:', err)
      toast.error('Could not start Google sign-in. Please try again.')
    }
  }

  return (
    <div className="mb-6 flex justify-between gap-3">
      <SocialButton
        className="bg-white hover:bg-gray-200 transition-colors"
        icon={<GoogleIcon className="size-8" />}
        onClick={handleGoogleLogin}
      />
      <SocialButton
        icon={<FacebookIcon className="size-8 text-white" />}
        className="border-muted-foreground/30 border bg-[var(--facebook-blue)] hover:bg-[var(--facebook-blue)]/80 transition-colors"
      />
      <SocialButton
        icon={<DiscordIcon className="size-12 text-white" />}
        className="border-muted-foreground/30 border bg-[var(--discord-blue)] hover:bg-[var(--discord-blue)]/80 transition-colors"
        onClick={() => handleSocialLoginUnavailable('Discord')}
      />
      {/* <SocialButton
        icon={<AppleIcon className="size-8 text-white" />}
        className="bg-background hover:bg-white/10 transition-colors"
      /> */}
    </div>
  )
}
