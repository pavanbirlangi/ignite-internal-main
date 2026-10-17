'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
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
import { Button } from '@/components/ui/button'
import { languages } from '@/lib/region-data'
import {
  getSelectableCountries,
  getSelectableCurrencies,
  type SelectableCountry,
  type SelectableCurrency,
} from '@/lib/services/locale-options.service'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import { useCartStore } from '@/store/useCartStore'

// Black fields with a border, like the checkout inputs; the list opens as a
// panel in the modal's own colour.
const TRIGGER_CLASS =
  'bg-background border-border h-11 w-full rounded-lg border text-sm font-medium text-white/95 transition-colors hover:border-white/20 focus:ring-0 focus-visible:border-primary/70 data-[state=open]:border-primary/70'
const CONTENT_CLASS =
  'border-border bg-card max-h-72 rounded-xl border p-1 text-white/95 shadow-[0_16px_40px_rgba(0,0,0,0.5)]'
const ITEM_CLASS =
  'cursor-pointer rounded-lg py-2.5 pl-3 text-sm font-medium text-white/80 transition-colors focus:bg-white/5 focus:text-white data-[state=checked]:text-white'
const LABEL_CLASS = 'text-xs font-bold tracking-[1.2px] text-white/65 uppercase'

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
  const [isSaving, startSaving] = useTransition()
  const queryClient = useQueryClient()
  const router = useRouter()

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

  // Updates prices in place instead of reloading the page (a reload jumped
  // back to the top and redrew every section). The new currency cookie is
  // picked up by the server-rendered parts (router.refresh), the client-fetched
  // product lists (React Query) and the cart's displayed amounts; the cart
  // itself stays in USD. The refresh and the close run as one transition, so
  // Save keeps spinning and the modal only closes once the re-rendered page,
  // new prices included, is ready to show.
  const handleSave = () =>
    startSaving(async () => {
      setPreferences(country, currency, storeLanguage)
      await Promise.all([
        queryClient.invalidateQueries(),
        useCartStore.getState().loadCart(),
      ])
      // Wrapped again after the await so it stays part of this transition.
      startSaving(() => {
        router.refresh()
        setOpen(false)
      })
    })

  const languageLabel =
    languages.find((l) => l.value === storeLanguage)?.label ?? 'English'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="border-border bg-card p-0 text-white/95 shadow-2xl sm:max-w-110 sm:rounded-2xl"
      >
        <div className="p-7">
          <DialogHeader className="border-border mb-5 flex flex-row items-start justify-between gap-4 border-b pb-5 text-left">
            <div>
              <DialogTitle className="mb-1 text-xl font-bold text-white/95">
                Update Your Settings
              </DialogTitle>
              <p className="text-sm text-white/65">
                Set your preferred country, currency and language
              </p>
            </div>
            {/* Round, with a clear hover; the focus ring only shows for
                keyboard users (opening the modal focuses this button). */}
            <DialogClose
              aria-label="Close settings"
              className="group/close grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-white/5 transition-colors outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <X
                className="size-[18px] text-white/65 transition-colors group-hover/close:text-white"
                strokeWidth={2}
              />
            </DialogClose>
          </DialogHeader>

          <div className="flex flex-col gap-4">
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
                <SelectTrigger className={`${TRIGGER_CLASS} disabled:opacity-50`}>
                  <SelectValue>{languageLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent className={CONTENT_CLASS}>
                  <SelectItem value={storeLanguage} className={ITEM_CLASS}>
                    {languageLabel}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Shared Button styles, so hover (glow and lift) and loading (the
                product cards' spinner ring) match the rest of the site. Save
                keeps spinning until the new prices are on screen. */}
            <div className="mt-2 flex gap-3">
              <Button
                variant="primary"
                onClick={handleSave}
                loading={isSaving}
                disabled={!country || !currency}
                className="h-11 flex-1 rounded-lg text-sm md:text-sm"
              >
                Save
              </Button>
              <DialogClose asChild>
                <Button
                  variant="secondary"
                  disabled={isSaving}
                  className="border-border h-11 flex-1 rounded-lg border bg-transparent text-sm font-medium hover:bg-white/5 md:text-sm"
                >
                  Cancel
                </Button>
              </DialogClose>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
