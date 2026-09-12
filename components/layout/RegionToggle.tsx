'use client'

import React, { useEffect, useState } from 'react'
import LanguageModal from './LanguageModal'
import { countries, languages } from '@/lib/region-data'
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

  return (
    <LanguageModal>
      <button
        title="Change language and currency"
        className="bg-secondary border-border flex h-14 min-w-35 cursor-pointer items-center gap-3 rounded-full border px-4 transition-colors hover:border-white/20"
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10">
          {mounted ? (
            <Image
              src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
              alt={countryCode}
              width={40}
              height={30}
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
