'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { AboutCover } from '@/lib/services/about-covers'
import { CoverFan, CoverFill } from './about-art'
import styles from './about.module.css'

interface AboutHeroProps {
  title?: string
  description?: string
  buttonText?: string
  buttonUrl?: string
  showImage?: boolean
  covers?: AboutCover[]
}

// First word on its own line, the next two filled with covers ("instant access"), the rest
// smaller underneath; the cover fan rises in below as the page starts to scroll.
export default function AboutHero({
  title = 'Powering instant access to digital entertainment.',
  description = 'Increddy is a modern digital marketplace for games, software, gift cards, and subscriptions, delivering genuine keys instantly, securely, and globally.',
  buttonText = 'Explore Our Store',
  buttonUrl = '/store',
  showImage = true,
  covers = [],
}: AboutHeroProps) {
  const words = title.trim().split(/\s+/)
  const lead = words[0]
  const highlight = words.slice(1, 3).join(' ')
  const rest = words.slice(3).join(' ')

  return (
    <section className={`${styles.heroGlow} relative -mt-30 overflow-hidden pt-46 text-center md:pt-52`}>
      <div className="container [--max-width-container:1240px]">
        <h1 data-display className={`${styles.headline} mx-auto max-w-275 text-white/95`}>
          {lead}{' '}
          {highlight && <CoverFill covers={covers.slice(0, 7)} size={460}>{highlight}</CoverFill>}
          {rest && <span className={styles.headlineRest}>{rest}</span>}
        </h1>
        <p className="mx-auto mt-7 max-w-155 text-base leading-[26px]! text-white/65 md:text-[18px] md:leading-7!">
          {description}
        </p>
        <Link
          href={buttonUrl}
          className="group/cta bg-primary relative mt-8 inline-flex h-12 items-center gap-2 overflow-hidden rounded-lg px-5.5 text-sm font-medium text-white shadow-[0_10px_30px_-8px_var(--primary-glow-60)] transition-all hover:-translate-y-px hover:brightness-110"
        >
          <span
            aria-hidden
            className="absolute inset-y-0 -left-1/2 w-2/5 -skew-x-20 bg-white/25 transition-transform duration-700 group-hover/cta:translate-x-[360%] motion-reduce:hidden"
          />
          {buttonText}
          <ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-1" />
        </Link>
      </div>
      {showImage && (
        <div className={styles.rise}>
          <CoverFan covers={[covers[9], covers[10], covers[0], covers[8], covers[2]].filter(Boolean)} />
        </div>
      )}
    </section>
  )
}
