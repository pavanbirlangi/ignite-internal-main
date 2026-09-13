import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'
import { ActivationGuideModal } from '@/components/shared/ActivationGuideModal'

interface ModalFooterProps {
  revealDate: string | null
  guideLoading?: boolean
  activationGuide?: {
    guide: string
    name: string
    icon?: string | null
  }
}

/**
 * Formats an ISO date string to a human-readable label.
 * Example: "April 13, 2026 at 10:12 AM UTC"
 */
function formatRevealDate(iso: string): string {
  try {
    const date = new Date(iso)
    if (isNaN(date.getTime())) return iso

    const datePart = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date)

    const timePart = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    }).format(date)

    return `${datePart} at ${timePart} UTC`
  } catch {
    return iso
  }
}

export const ModalFooter = ({
  revealDate,
  activationGuide,
  guideLoading,
}: ModalFooterProps) => {
  const [guideOpen, setGuideOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col gap-4 md:flex-row">
          {guideLoading ? (
            <div className="bg-card border-muted-foreground/30 h-10 w-36 animate-pulse rounded-md border" />
          ) : activationGuide ? (
            <>
              <ActivationGuideModal
                open={guideOpen}
                onOpenChange={setGuideOpen}
                title={activationGuide.name}
                guideHtml={activationGuide.guide}
              />
              <Button
                variant="ghost"
                onClick={() => setGuideOpen(true)}
                className="border-muted-foreground! bg-card h-10 border px-6 py-4 text-sm font-semibold text-white hover:bg-white/5"
              >
                Activation Guide
              </Button>
            </>
          ) : null}
          {/* <Button
            asChild
            className="bg-primary hover:bg-primary/90 h-10 text-sm font-semibold text-white"
          >
            <a
              href="https://store.steampowered.com/account/registerkey"
              target="_blank"
              rel="noopener noreferrer"
            >
              Redeem on Steam{' '}
              <ExternalLink className="size-4 text-white hover:text-white/80" />
            </a>
          </Button> */}
        </div>
        {revealDate && (
          <div className="text-right">
            <p className="text-muted-foreground text-xs font-semibold">
              Key revealed on
            </p>
            <p className="text-sm font-medium text-white">
              {formatRevealDate(revealDate)}
            </p>
          </div>
        )}
      </div>

      <p className="text-muted-foreground border-card border-t-[0.5px] border-b-[0.5px] py-4 text-center text-xs font-medium md:text-left">
        Facing issues with the key? You can raise a ticket{' '}
        <Link href="/help" className="font-semibold text-white underline">
          here
        </Link>
        . (Our support will get in touch with you within 48 hours)
      </p>
    </div>
  )
}
