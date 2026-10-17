'use client'

import { Zap, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { ReactNode } from 'react'
import type { AboutCover } from '@/lib/services/about-covers'
import { CoverFill, splitAround, useTilt } from './about-art'
import styles from './about.module.css'

interface FeatureBlock {
  title: string
  icon?: string
  description: string
}

interface FeaturesProps {
  title?: string
  description?: string
  blocks?: FeatureBlock[]
  covers?: AboutCover[]
}

const defaultIcons: ReactNode[] = [
  <Zap key="speed" className="size-4.5" />,
  <ShieldCheck key="trust" className="size-4.5" />,
  <CheckCircle2 key="clarity" className="size-4.5" />,
]

const fallbackFeatures: FeatureBlock[] = [
  {
    title: 'Speed',
    description: 'Digital keys and codes are delivered immediately after checkout. No delays, no waiting.',
  },
  {
    title: 'Trust',
    description: 'Every product on Increddy is sourced from verified distributors and delivered securely.',
  },
  {
    title: 'Clarity',
    description: 'Clear pricing, platform compatibility, and region details, before you buy.',
  },
]

// Which covers fill each value word, so neighbouring tiles don't repeat the same artwork.
const TILE_COVERS = [
  [0, 4, 1, 3],
  [2, 5, 11, 6],
  [1, 3, 0, 4],
]

function FeatureTile({ feature, index, covers }: { feature: FeatureBlock; index: number; covers: AboutCover[] }) {
  const ref = useTilt<HTMLDivElement>(0.5)
  const tileCovers = (TILE_COVERS[index % TILE_COVERS.length] ?? []).map((i) => covers[i]).filter(Boolean)
  return (
    <div
      ref={ref}
      className={`${styles.tile} bg-card border-border flex min-h-55 flex-col justify-between rounded-[20px] border p-5.5 hover:border-white/20 md:min-h-75 md:p-7`}
    >
      <span className="bg-primary/16 grid size-10 place-items-center rounded-xl text-[#7DB0FF] [&_svg]:size-4.5">
        {feature.icon ? (
          <span dangerouslySetInnerHTML={{ __html: feature.icon }} />
        ) : (
          (defaultIcons[index] ?? defaultIcons[0])
        )}
      </span>
      <div className="relative">
        <h3 data-display className={`${styles.tileWord} text-white/95`}>
          <CoverFill covers={tileCovers} size={260}>
            {feature.title}
          </CoverFill>
        </h3>
        <p className="mt-4 text-[15px] leading-6! text-white/65">{feature.description}</p>
      </div>
    </div>
  )
}

export default function Features({
  title = 'Built for instant access to digital experiences.',
  description = 'Increddy is a modern marketplace for games, software, gift cards, and subscriptions designed around speed, security, and clarity.',
  blocks,
  covers = [],
}: FeaturesProps) {
  const features = blocks?.length ? blocks : fallbackFeatures
  const parts = splitAround(title, 'instant access')

  return (
    <section className="border-border relative z-10 w-full border-t py-18 md:py-30">
      <div className="container [--max-width-container:1240px]">
        <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
          <h2 data-display className="text-[28px] leading-[34px] font-bold tracking-[-0.4px] text-white/95 md:text-[44px] md:leading-[50px] md:tracking-[-0.8px]">
            {parts ? (
              <>
                {parts[0]}
                <CoverFill covers={covers.slice(0, 4)} size={300}>
                  {parts[1]}
                </CoverFill>
                {parts[2]}
              </>
            ) : (
              title
            )}
          </h2>
          <p className="max-w-130 text-base leading-[26px]! text-white/65 md:text-[18px] md:leading-7!">{description}</p>
        </div>

        <div className={`${styles.tiles} mt-8 grid grid-cols-1 gap-4 md:mt-14 md:grid-cols-3`}>
          {features.map((feature, index) => (
            <FeatureTile key={`${feature.title}-${index}`} feature={feature} index={index} covers={covers} />
          ))}
        </div>
      </div>
    </section>
  )
}
