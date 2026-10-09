'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'
import { languages } from '@/lib/region-data'
import {
  getSelectableCountries,
  getSelectableCurrencies,
  type SelectableCountry,
  type SelectableCurrency,
} from '@/lib/services/locale-options.service'
import { useCurrencyStore } from '@/store/useCurrencyStore'

const TRIGGER_CLASS =
  'bg-secondary h-14 w-full rounded-[12px] border-none font-medium text-white focus:ring-0'
const CONTENT_CLASS = 'border-border bg-secondary max-h-80 rounded-[12px] text-white'
const ITEM_CLASS =
  'cursor-pointer rounded-lg py-3 font-medium focus:bg-white/10 focus:text-white'
const LABEL_CLASS = 'text-muted-foreground md:font-base text-xs font-semibold'

function Flag({ code }: { code: string }) {
  return (
    <Image
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt=""
      width={20}
      height={15}
      className="h-3.75 w-5 shrink-0 rounded-[2px] object-cover"
    />
  )
}

export default function LanguageModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const storeCountry = useCurrencyStore((state) => state.country)
  const storeCurrency = useCurrencyStore((state) => state.currency)
  const storeLanguage = useCurrencyStore((state) => state.language)
  const setPreferences = useCurrencyStore((state) => state.setPreferences)

  const [country, setCountry] = useState(storeCountry)
  const [currency, setCurrency] = useState(storeCurrency)
  const [countries, setCountries] = useState<SelectableCountry[]>([])
  const [currencies, setCurrencies] = useState<SelectableCurrency[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    getSelectableCountries()
      .then(setCountries)
      .catch((error) => console.error('Failed to load countries:', error))
    getSelectableCurrencies()
      .then(setCurrencies)
      .catch((error) => console.error('Failed to load currencies:', error))
  }, [])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      setCountry(storeCountry)
      setCurrency(storeCurrency)
    }
  }

  const handleSave = () => {
    setIsSaving(true)
    setPreferences(country, currency, storeLanguage)
    // A full reload so server-rendered prices (product pages, homepage carousels) pick up the new
    // currency cookie, and the cart moves to it on the next load.
    window.location.reload()
  }

  const languageLabel =
    languages.find((l) => l.value === storeLanguage)?.label ?? 'English'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="border-secondary bg-secondary p-0 text-white shadow-2xl sm:max-w-140 sm:rounded-2xl"
      >
        <div className="p-8 sm:p-10">
          <DialogHeader className="mb-8 flex flex-row items-start justify-between">
            <div>
              <DialogTitle className="mb-2 text-xl font-semibold tracking-tight text-white md:text-2xl">
                Update Your Settings
              </DialogTitle>
              <p className="text-muted-foreground text-sm font-medium">
                Set your preferred country, currency and language
              </p>
            </div>
            <DialogClose
              aria-label="Close settings"
              className="cursor-pointer rounded-sm p-1 transition-colors hover:bg-white/10"
            >
              <X className="text-muted-foreground h-5 w-5" strokeWidth={2} />
            </DialogClose>
          </DialogHeader>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className={LABEL_CLASS}>Country</label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className={TRIGGER_CLASS}>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" className={CONTENT_CLASS}>
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.code} className={ITEM_CLASS}>
                      <span className="flex items-center gap-3">
                        <Flag code={c.code} />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className={LABEL_CLASS}>Currency</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className={TRIGGER_CLASS}>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" className={CONTENT_CLASS}>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code} className={ITEM_CLASS}>
                      {c.name} ({c.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className={LABEL_CLASS}>Language</label>
              <Select value={storeLanguage} disabled>
                <SelectTrigger className={`${TRIGGER_CLASS} disabled:opacity-60`}>
                  <SelectValue>{languageLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent className={CONTENT_CLASS}>
                  <SelectItem value={storeLanguage} className={ITEM_CLASS}>
                    {languageLabel}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">More languages coming soon.</p>
            </div>

            <div className="mt-2 flex gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving || !country || !currency}
                className="bg-primary hover:bg-primary flex-1 rounded-[6px] py-3.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? 'Saving' : 'Save'}
              </button>
              <DialogClose asChild>
                <button className="border-border flex-1 rounded-[6px] border bg-transparent py-3.5 text-sm text-white transition-colors hover:bg-white/5">
                  Cancel
                </button>
              </DialogClose>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
