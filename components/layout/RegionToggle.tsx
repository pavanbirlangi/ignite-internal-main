'use client'

import React, { useEffect, useState } from 'react'
import LanguageModal from './LanguageModal'
import { languages } from '@/lib/region-data'
import Image from 'next/image'
import { useCurrencyStore } from '@/store/useCurrencyStore'

export default function RegionToggle() {
  const [mounted, setMounted] = useState(false)
  const currency = useCurrencyStore((state) => state.currency)
  const language = useCurrencyStore((state) => state.language)
  const countryCode = useCurrencyStore((state) => state.country)
  const initLocation = useCurrencyStore((state) => state.initLocation)

  useEffect(() => {
    setMounted(true)
    initLocation()
  }, [initLocation])

  const currentLanguage = languages.find((l) => l.value === language)
  const fullLanguageName = currentLanguage ? currentLanguage.label : language

  // Display-only: the eurozone has no single country flag, and the stored
  // country is a real member state (AT) so region lookups keep working --
  // but showing Austria's flag for a region labelled "Europe" reads as a
  // mistake, so the EU flag is substituted here and here only.
  const flagCode =
    currency.toUpperCase() === 'EUR' ? 'eu' : countryCode.toLowerCase()

  return (
    <LanguageModal>
      <button
        title="Change language and currency"
        className="bg-secondary border-border flex h-14 min-w-35 cursor-pointer items-center gap-3 rounded-full border px-4 transition-colors hover:border-white/20"
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10">
          {mounted ? (
            <Image
              src={`https://flagcdn.com/w80/${flagCode}.png`}
              alt={countryCode}
              width={80}
              height={60}
              // w80 rather than w40: this renders into a 24px circle, so a
              // 40px-wide source had under 2x density and looked soft on any
              // retina screen. flagcdn also serves SVG, but next/image needs
              // `dangerouslyAllowSVG` for that, which isn't worth enabling
              // site-wide just for this.
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full animate-pulse bg-white/10" />
          )}
        </div>
        <span className="text-sm font-semibold text-white">
          {mounted ? `${currency} / ${fullLanguageName}` : 'USD / English'}
        </span>
      </button>
    </LanguageModal>
  )
}
