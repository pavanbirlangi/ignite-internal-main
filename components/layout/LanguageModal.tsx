'use client'

import React, { useEffect, useState } from 'react'
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
import { currencies, languages, getCountryForCurrency } from '@/lib/region-data'
import { marketsService } from '@/lib/services/markets.service'
import { useCurrencyStore } from '@/store/useCurrencyStore'

const priorityCurrencyOrder = ['USD', 'EUR', 'HKD', 'INR', 'GBP']
const priorityCurrencyMap = new Map(
  priorityCurrencyOrder.map((code, index) => [code, index]),
)

const sortCurrencies = (list: { value: string; label: string }[]) => {
  return [...list].sort((a, b) => {
    const aCode = a.value.toUpperCase()
    const bCode = b.value.toUpperCase()
    const aPriority = priorityCurrencyMap.get(aCode)
    const bPriority = priorityCurrencyMap.get(bCode)

    if (aPriority !== undefined && bPriority !== undefined) {
      return aPriority - bPriority
    }
    if (aPriority !== undefined) return -1
    if (bPriority !== undefined) return 1

    return a.label.localeCompare(b.label)
  })
}

export default function LanguageModal({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const storeCurrency = useCurrencyStore((state) => state.currency)
  const storeLanguage = useCurrencyStore((state) => state.language)
  const setRegion = useCurrencyStore((state) => state.setRegion)

  const [currency, setCurrency] = useState(storeCurrency)
  const [language, setLanguage] = useState(storeLanguage)
  const [availableCurrencies, setAvailableCurrencies] = useState<
    { value: string; label: string }[]
  >([])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      setCurrency(storeCurrency)
      setLanguage(storeLanguage)
    }
  }

  // Fetch available currencies from the currencies API on mount
  useEffect(() => {
    const fetchCurrencies = async () => {
      const fetchedCurrencies = await marketsService.getCurrencies()
      if (fetchedCurrencies.length > 0) {
        const finalCurrencies = fetchedCurrencies.map((currencyCode) => {
          const normalizedCode = currencyCode.toUpperCase()
          const existing = currencies.find((c) => c.value === normalizedCode)
          return existing || { value: normalizedCode, label: normalizedCode }
        })
        const unique = Array.from(
          new Map(finalCurrencies.map((c) => [c.value, c])).values(),
        )
        setAvailableCurrencies(sortCurrencies(unique))
      } else {
        setAvailableCurrencies(sortCurrencies(currencies))
      }
    }
    fetchCurrencies()
  }, [])

  const [isSaving, setIsSaving] = useState(false)

  const selectedCurrency =
    availableCurrencies.length > 0 &&
    !availableCurrencies.some((c) => c.value === currency)
      ? availableCurrencies.find((c) => c.value === 'USD')?.value ||
        availableCurrencies[0].value
      : currency

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const countryToSave = getCountryForCurrency(selectedCurrency)
      await setRegion(countryToSave, selectedCurrency, language)

      // Route changing logic based on language (not country)
      const currentPath = window.location.pathname
      const currentLangPrefix = currentPath.split('/')[1]
      const availableLangs = languages.map((l) => l.value.toLowerCase())

      let newPath = currentPath
      const newLangPrefix = language.toLowerCase()

      if (availableLangs.includes(currentLangPrefix)) {
        // Replace existing lang prefix
        newPath = currentPath.replace(
          `/${currentLangPrefix}`,
          `/${newLangPrefix}`,
        )
        if (newPath === '') newPath = '/'
      } else {
        // Add new lang prefix
        newPath = `/${newLangPrefix}${currentPath === '/' ? '' : currentPath}`
      }

      // Redirect with ?currency= so the proxy sets fresh cookies authoritatively
      // The proxy will strip the param after processing, resulting in a clean URL
      window.location.href = `${newPath}?currency=${encodeURIComponent(selectedCurrency)}`
    } catch (error) {
      console.error('Failed to change region:', error)
      setIsSaving(false)
    }
  }

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
                Set your preferred currency and language
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
              <label className="text-muted-foreground md:font-base text-xs font-semibold">
                Currency
              </label>
              <Select value={selectedCurrency} onValueChange={setCurrency}>
                <SelectTrigger className="bg-secondary h-14 w-full rounded-[12px] border-none font-medium text-white focus:ring-0">
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  side="bottom"
                  className="border-border bg-secondary rounded-[12px] text-white"
                >
                  {availableCurrencies.map((c) => (
                    <SelectItem
                      key={c.value}
                      value={c.value}
                      className="cursor-pointer rounded-lg py-3 font-medium focus:bg-white/10 focus:text-white"
                    >
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-muted-foreground md:font-base text-xs font-semibold">
                Language
              </label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-secondary h-14 w-full rounded-[12px] border-none font-medium text-white focus:ring-0">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  side="bottom"
                  avoidCollisions={false}
                  className="border-border bg-secondary rounded-[12px] text-white"
                >
                  {languages.map((l) => (
                    <SelectItem
                      key={l.value}
                      value={l.value}
                      className="cursor-pointer rounded-lg py-3 font-medium focus:bg-white/10 focus:text-white"
                    >
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-2 flex gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
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
