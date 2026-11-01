'use client'

import { useCallback, useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { Cookie } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, localizedHref } from '@/lib/utils'
import { IP_COUNTRY_COOKIE } from '@/lib/utils/display-currency'
import {
  OPEN_COOKIE_SETTINGS_EVENT,
  getStoredConsent,
  needsConsentPrompt,
  saveConsent,
  type ConsentChoice,
} from '@/lib/consent'

const LEAVE_MS = 200
const SHOW_DELAY_MS = 800

// The cookie card (design pick B, bottom left; full width above the phone menu). Shown on its own
// only to EU/EEA, UK and Swiss visitors who haven't chosen yet (lib/consent.ts); anyone can reopen
// it from the footer's Cookie settings link. Every choice is instant, so no loading states.
export default function CookieConsent({ locale }: { locale: string }) {
  const [mounted, setMounted] = useState(false)
  const [shown, setShown] = useState(false)
  const [customizing, setCustomizing] = useState(false)
  const [choice, setChoice] = useState<ConsentChoice>({ analytics: false, ads: false })

  const open = useCallback((customize: boolean) => {
    const stored = getStoredConsent()
    setChoice(stored ?? { analytics: false, ads: false })
    setCustomizing(customize)
    setMounted(true)
    // Next frame, so the card slides in from its start position.
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
  }, [])

  useEffect(() => {
    // A moment after the page has drawn, so the card never competes with the page's first paint.
    const timer = window.setTimeout(() => {
      if (!getStoredConsent() && needsConsentPrompt(Cookies.get(IP_COUNTRY_COOKIE))) open(false)
    }, SHOW_DELAY_MS)
    const reopen = () => open(true)
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen)
    }
  }, [open])

  const decide = (next: ConsentChoice) => {
    saveConsent(next)
    setShown(false)
    window.setTimeout(() => setMounted(false), LEAVE_MS)
  }

  if (!mounted) return null

  const actionClass = 'h-11 flex-1 text-[15px] md:text-[15px]'

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      className={cn(
        'fixed inset-x-3 bottom-21 z-60 flex flex-col gap-3.5 rounded-2xl border border-white/10 bg-[#171717] p-4 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)] md:inset-x-auto md:bottom-6 md:left-6 md:w-100 md:p-5',
        'transition-all duration-300 ease-out motion-reduce:transition-none',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="bg-primary/15 grid size-9 shrink-0 place-items-center rounded-[10px]">
          <Cookie className="size-5 text-[#7fb0ff]" aria-hidden />
        </span>
        <h2 id="cookie-consent-title" className="text-base font-semibold text-white">
          Cookies on Increddy
        </h2>
      </div>

      <p className="text-sm leading-relaxed text-white/78">
        We use cookies to run the site, see how it&apos;s used and measure our ads. Pick what you&apos;re OK
        with; you can change it any time from Cookie settings in the footer.{' '}
        <a
          href={localizedHref(locale, '/legal/privacy-policy')}
          className="text-[#7fb0ff] underline underline-offset-2 hover:text-white"
        >
          Privacy Policy
        </a>
      </p>

      {customizing && (
        <div className="flex flex-col divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
          <PreferenceRow title="Necessary" text="Sign-in, cart, checkout and security." />
          <PreferenceRow
            title="Analytics"
            text="Google Analytics: which pages are visited and how people find us."
            checked={choice.analytics}
            onChange={(analytics) => setChoice((current) => ({ ...current, analytics }))}
          />
          <PreferenceRow
            title="Advertising"
            text="Google Ads: which ads lead to purchases, and more relevant ads."
            checked={choice.ads}
            onChange={(ads) => setChoice((current) => ({ ...current, ads }))}
          />
        </div>
      )}

      {customizing ? (
        <div className="flex gap-2.5">
          <Button variant="primary" className={actionClass} onClick={() => decide(choice)}>
            Save choices
          </Button>
          <Button variant="secondary" className={actionClass} onClick={() => decide({ analytics: true, ads: true })}>
            Accept all
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2.5">
            <Button variant="primary" className={actionClass} onClick={() => decide({ analytics: true, ads: true })}>
              Accept all
            </Button>
            <Button variant="secondary" className={actionClass} onClick={() => decide({ analytics: false, ads: false })}>
              Reject all
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setCustomizing(true)}
            className="mx-auto h-9 cursor-pointer px-1.5 text-sm font-semibold text-white/78 underline-offset-3 transition-colors duration-200 hover:text-white hover:underline"
          >
            Customize
          </button>
        </div>
      )}
    </div>
  )
}

function PreferenceRow({
  title,
  text,
  checked,
  onChange,
}: {
  title: string
  text: string
  checked?: boolean
  onChange?: (value: boolean) => void
}) {
  return (
    <div className="flex items-start gap-3.5 bg-white/3 px-3.5 py-3">
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-[13px] leading-snug text-white/65">{text}</p>
      </div>
      {onChange ? (
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={title}
          onClick={() => onChange(!checked)}
          className={cn(
            'relative mt-0.5 h-6 w-10 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
            checked ? 'bg-primary' : 'bg-white/18',
          )}
        >
          <span
            className={cn(
              'absolute top-0.75 left-0.75 size-4.5 rounded-full bg-white transition-transform duration-200 motion-reduce:transition-none',
              checked && 'translate-x-4',
            )}
          />
        </button>
      ) : (
        <span className="mt-0.5 text-xs whitespace-nowrap text-white/65">Always on</span>
      )}
    </div>
  )
}
