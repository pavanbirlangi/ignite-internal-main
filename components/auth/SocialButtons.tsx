import React from 'react'
import { cn } from '@/lib/utils'

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

export function SocialButtons() {
  const handleOAuthLogin = (provider: string) => {
    // Use the dedicated lightweight callback route
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth-callback`
    const shop = process.env.NEXT_PUBLIC_SHOP_URL
    const storefrontAccessToken = process.env.NEXT_PUBLIC_STORE_ACCESS_TOKEN

    const authUrl = `${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/headless/login?shop=${shop}&provider=${provider}&return_url=${redirectUrl}&storefront_access_token=${storefrontAccessToken}`

 
    const width = Math.min(500, window.outerWidth - 20); 
    const height = Math.min(600, window.outerHeight - 20); 
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);

    const popup = window.open(authUrl, `${provider} OAuth`, `width=${width},height=${height},left=${left},top=${top}`);

    if (!popup) {
      window.location.href = authUrl;
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'OAUTH_SUCCESS') {
        window.removeEventListener('message', handleMessage);

        const { accessToken, expiresAt } = event.data.payload || {};
        
        if (accessToken) {
          sessionStorage.setItem('accessToken', accessToken);
          if (expiresAt) sessionStorage.setItem('expiresAt', expiresAt);
          window.location.href = window.location.pathname;
        } else {
          // Fallback if no token was passed
          window.location.reload();
        }
      }
    };

    window.addEventListener('message', handleMessage);

    const pollTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer);
        window.removeEventListener('message', handleMessage);
      }
    }, 500);
  }

  const handleGoogleLogin = () => handleOAuthLogin('google')
  const handleDiscordLogin = () => handleOAuthLogin('discord')

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
        onClick={handleDiscordLogin}
      />
      {/* <SocialButton
        icon={<AppleIcon className="size-8 text-white" />}
        className="bg-background hover:bg-white/10 transition-colors"
      /> */}
    </div>
  )
}
