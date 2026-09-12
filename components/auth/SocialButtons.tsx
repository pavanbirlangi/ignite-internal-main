import React from 'react'
import { toast } from 'sonner'
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

// Social login isn't wired up to Medusa yet: Google's Medusa auth provider is
// registered but not activated (needs a Google Cloud OAuth Client ID/Secret,
// see MEDUSA_MIGRATION_BACKEND_REQUIREMENTS.md), and Discord has no Medusa
// auth provider at all. Buttons stay visible (matching how Facebook already
// renders with no handler in this design) rather than being removed.
function handleSocialLoginUnavailable(provider: string) {
  toast.error(`${provider} login isn't available yet`)
}

export function SocialButtons() {
  return (
    <div className="mb-6 flex justify-between gap-3">
      <SocialButton
        className="bg-white hover:bg-gray-200 transition-colors"
        icon={<GoogleIcon className="size-8" />}
        onClick={() => handleSocialLoginUnavailable('Google')}
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
