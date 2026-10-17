import { ListChecks } from 'lucide-react'
import { ACCOUNT_SECONDARY_BUTTON_CLASS } from '@/components/library/account-ui'
import Link from 'next/link'
import { useState } from 'react'
import { ActivationGuideModal } from '@/components/shared/ActivationGuideModal'

interface ModalFooterProps {
  revealDate: string | null
  guideLoading?: boolean
  activationGuide?: {
    guide?: string
    name: string
    icon?: string | null
    link?: string | null
  }
}

/**
 * Formats an ISO date string in the viewer's own timezone, matching the order dates shown
 * elsewhere on the account pages.
 * Example: "13 Oct 2026, 4:11 PM"
 */
function formatRevealDate(iso: string): string {
  try {
    const date = new Date(iso)
    if (isNaN(date.getTime())) return iso

    const datePart = new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)

    const timePart = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)

    return `${datePart}, ${timePart}`
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

  if (!guideLoading && !activationGuide && !revealDate) return null

  return (
    <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
      {guideLoading ? (
        <div className="bg-secondary h-10 w-44 animate-pulse rounded-lg" />
      ) : activationGuide ? (
        <>
          <ActivationGuideModal
            open={guideOpen}
            onOpenChange={setGuideOpen}
            title={activationGuide.name}
            guideHtml={activationGuide.guide}
            guideLink={activationGuide.link}
          />
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className={ACCOUNT_SECONDARY_BUTTON_CLASS}
          >
            <ListChecks />
            Activation guide
          </button>
        </>
      ) : (
        <span />
      )}
      {revealDate && (
        <p className="text-xs! leading-4! text-white/65 max-sm:text-center">
          Revealed on {formatRevealDate(revealDate)}
        </p>
      )}
    </div>
  )
}

// Bottom strip of the key modal: where to go when a key doesn't work.
export const KeyHelpLine = () => (
  <p className="text-center text-xs! leading-4! text-white/65">
    Key not working?{' '}
    <Link href="/help" className="font-medium text-white/95 underline-offset-2 hover:underline">
      Raise a ticket
    </Link>
    , our support gets back to you within 48 hours.
  </p>
)
