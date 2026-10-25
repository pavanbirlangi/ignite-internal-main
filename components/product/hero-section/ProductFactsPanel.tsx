'use client'

import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import { ActivationGuideModal } from '@/components/shared/ActivationGuideModal'
import type { Product } from '@/types/product'

interface ProductFactsPanelProps {
  product: Product
  labels: {
    heading: string
    platform: string
    region: string
    worksOn: string
    genre: string
    delivery: string
    deliveryInstant: string
    deliveryStandard: string
    activation: string
    howToActivate: string
  }
}

// Two-letter values come from admin in any case ("Pc"); show them as the abbreviation they are.
const formatWorksOn = (values: string[]) =>
  values.map((value) => (value.length <= 2 ? value.toUpperCase() : value)).join(', ')

const ROW_CLASS = 'border-border flex items-start justify-between gap-4 border-b py-3 text-sm last:border-b-0'

// The product's facts beside "About this game" on desktop (below it on phones): only what every
// product has in the admin (platform, region, works on, genre, delivery, activation guide).
export default function ProductFactsPanel({ product, labels }: ProductFactsPanelProps) {
  const guide = product.activationGuide
  const platform = product.platform[0] || guide?.name
  const rows: { label: string; value: React.ReactNode }[] = []
  if (platform) {
    rows.push({
      label: labels.platform,
      value: (
        <span className="inline-flex items-center gap-2">
          {guide?.icon && (
            <Image src={guide.icon} alt="" width={16} height={16} className="size-4 object-contain" />
          )}
          {guide?.name || platform}
        </span>
      ),
    })
  }
  if (product.region?.length) rows.push({ label: labels.region, value: product.region.join(', ') })
  if (product.worksOn?.length) rows.push({ label: labels.worksOn, value: formatWorksOn(product.worksOn) })
  if (product.genre?.length) rows.push({ label: labels.genre, value: product.genre.join(', ') })
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
          <div key={row.label} className={ROW_CLASS}>
            <span className="shrink-0 text-white/55">{row.label}</span>
            <span className="text-right font-medium text-white/95">{row.value}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
