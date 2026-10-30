'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { ActivationGuideModal } from '@/components/shared/ActivationGuideModal'
import type { CmsGameFacts } from '@/lib/services/cms-product.service'
import type { Product } from '@/types/product'
import { cn } from '@/lib/utils'
import PegiIcon, { isPegiAge } from './PegiIcon'

interface ProductFactsPanelProps {
  product: Product
  gameFacts?: CmsGameFacts | null
  locale?: string
  labels: {
    heading: string
    publisher: string
    developer: string
    releaseDate: string
    languages: string
    ageRating: string
    delivery: string
    deliveryInstant: string
    deliveryStandard: string
    activation: string
    howToActivate: string
  }
}

// Languages shown before the "+N" that reveals the rest.
const LANGUAGES_SHOWN = 4

const ROW_CLASS = 'border-border flex items-start justify-between gap-4 border-b py-3 text-sm last:border-b-0'

// "2020-12-10" -> "10 Dec 2020" (in the page's language); read as UTC so it never shifts a day.
function formatReleaseDate(value: string, locale?: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return value
  const language = !locale || locale.toLowerCase() === 'en' ? 'en-GB' : locale
  try {
    return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date)
  } catch {
    return value
  }
}

function LanguageList({ languages }: { languages: string[] }) {
  const [expanded, setExpanded] = useState(false)
  const hidden = languages.length - LANGUAGES_SHOWN
  if (expanded || hidden <= 0) return <>{languages.join(', ')}</>
  return (
    <>
      {languages.slice(0, LANGUAGES_SHOWN).join(', ')}{' '}
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label={`Show all ${languages.length} languages`}
        className="cursor-pointer font-medium text-[#7DB0FF] transition-colors hover:text-[#A9C9FF]"
      >
        +{hidden}
      </button>
    </>
  )
}

// The game's facts beside "About this game" on desktop (below it on phones): publisher,
// developer, release date, languages and PEGI rating from the product in Directus (each row only
// when filled in), then how it's delivered and activated. Platform, region and genre are already
// in the hero and under About, so they aren't repeated here.
export default function ProductFactsPanel({ product, gameFacts, locale, labels }: ProductFactsPanelProps) {
  const guide = product.activationGuide
  const rows: { label: string; value: React.ReactNode; center?: boolean }[] = []
  if (gameFacts?.publisher) rows.push({ label: labels.publisher, value: gameFacts.publisher })
  if (gameFacts?.developer) rows.push({ label: labels.developer, value: gameFacts.developer })
  if (gameFacts?.releaseDate) {
    rows.push({ label: labels.releaseDate, value: formatReleaseDate(gameFacts.releaseDate, locale) })
  }
  if (gameFacts?.languages.length) {
    rows.push({ label: labels.languages, value: <LanguageList languages={gameFacts.languages} /> })
  }
  if (isPegiAge(gameFacts?.ageRating)) {
    rows.push({
      label: labels.ageRating,
      value: <PegiIcon age={gameFacts.ageRating} className="ml-auto block h-8.5 w-7" />,
      center: true,
    })
  }
  rows.push({
    label: labels.delivery,
    value: product.instantDelivery ? labels.deliveryInstant : labels.deliveryStandard,
  })
  if (guide && (guide.guide || guide.link)) {
    rows.push({
      label: labels.activation,
      value: (
        <ActivationGuideModal title={guide.name} guideHtml={guide.guide} guideLink={guide.link}>
          <button
            type="button"
            className="group/link inline-flex cursor-pointer items-center gap-1 font-medium text-[#7DB0FF] transition-colors hover:text-[#A9C9FF]"
          >
            {labels.howToActivate}
            <ChevronRight className="size-3.5 transition-transform group-hover/link:translate-x-0.5" />
          </button>
        </ActivationGuideModal>
      ),
    })
  }

  return (
    <aside aria-labelledby="product-details-heading">
      <h2
        id="product-details-heading"
        className="mb-4 text-xl leading-[26px] font-bold text-white/95"
      >
        {labels.heading}
      </h2>
      <div className="bg-card border-border rounded-xl border px-5 py-1">
        {rows.map((row) => (
          <div key={row.label} className={cn(ROW_CLASS, row.center && 'items-center')}>
            <span className="shrink-0 text-white/55">{row.label}</span>
            <span className="text-right font-medium text-white/95">{row.value}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
