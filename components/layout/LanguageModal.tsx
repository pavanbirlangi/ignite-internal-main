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
import { languages } from '@/lib/region-data'
import { getRegions, type MedusaRegion } from '@/lib/utils/region-resolver'
import { useCurrencyStore } from '@/store/useCurrencyStore'

export default function LanguageModal({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const storeRegionId = useCurrencyStore((state) => state.regionId)
  const storeLanguage = useCurrencyStore((state) => state.language)
  const setRegion = useCurrencyStore((state) => state.setRegion)

  const [regionId, setRegionId] = useState(storeRegionId)
  const [language, setLanguage] = useState(storeLanguage)
  // Real regions only -- whatever the admin has actually configured in
  // Medusa, not a hardcoded world-currency list. A store with one region
  // shows one option, a store with ten shows ten; nothing to maintain here
  // as the catalog's supported markets change.
  const [availableRegions, setAvailableRegions] = useState<MedusaRegion[]>([])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      setRegionId(storeRegionId)
      setLanguage(storeLanguage)
    }
  }

  useEffect(() => {
    getRegions()
      .then(setAvailableRegions)
      .catch((error) => console.error('Failed to load regions:', error))
  }, [])

  const [isSaving, setIsSaving] = useState(false)

  const selectedRegionId =
    availableRegions.length > 0 &&
    !availableRegions.some((r) => r.id === regionId)
      ? availableRegions[0].id
      : regionId

  const handleSave = async () => {
    const selectedRegion = availableRegions.find(
      (r) => r.id === selectedRegionId,
    )
    if (!selectedRegion) {
      console.error('No region selected -- regions may not have loaded yet')
      return
    }

    try {
      setIsSaving(true)
      const country = (selectedRegion.countries[0] || 'us').toUpperCase()
      await setRegion(
        selectedRegion.id,
        country,
        selectedRegion.currencyCode,
        language,
      )

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

      // setRegion() above already wrote the region/currency/country cookies
      // directly -- no need for the old ?currency= query-param round trip
      // through proxy.ts, they're already set by the time this navigation's
      // request goes out.
      window.location.href = newPath
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
                Region / Currency
              </label>
              <Select value={selectedRegionId} onValueChange={setRegionId}>
                <SelectTrigger className="bg-secondary h-14 w-full rounded-[12px] border-none font-medium text-white focus:ring-0">
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  side="bottom"
                  className="border-border bg-secondary rounded-[12px] text-white"
                >
                  {availableRegions.map((region) => (
                    <SelectItem
                      key={region.id}
                      value={region.id}
                      className="cursor-pointer rounded-lg py-3 font-medium focus:bg-white/10 focus:text-white"
                    >
                      {region.name} ({region.currencyCode})
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
