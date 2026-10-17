'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { AboutCover } from '@/lib/services/about-covers'
import styles from './about.module.css'

interface HowItWorksBlock {
  title: string
  subtitle: string
  description: string
}

interface HowItWorksProps {
  title?: string
  blocks?: HowItWorksBlock[]
  covers?: AboutCover[]
}

const fallbackSteps: HowItWorksBlock[] = [
  {
    title: 'Discover',
    subtitle: 'Discover what you need',
    description:
      "Browse a wide selection of games, software, gift cards, and subscriptions across platforms and categories. Use search, genres, and curated sections to quickly find exactly what you're looking for without unnecessary filters or clutter.",
  },
  {
    title: 'Purchase',
    subtitle: 'Purchase with confidence',
    description:
      'Every product page clearly shows pricing, platform compatibility, region details, and activation information before you checkout. Complete your purchase securely with trusted payment methods and full price transparency.',
  },
  {
    title: 'Instant Access',
    subtitle: 'Get instant access',
    description:
      "Once your payment is confirmed, your digital key or code is delivered instantly. There's no waiting, shipping, or manual processing: your purchase is available immediately in your account or email.",
  },
  {
    title: 'Activate & Enjoy',
    subtitle: 'Activate and start using',
    description:
      'Follow simple, step-by-step activation instructions to redeem your game, software, or subscription. If you ever need help, our support team and guides are available to ensure a smooth experience from start to finish.',
  },
]

// A pinned 3D card that acts out the step in the middle of the screen: browse (fan spread),
// checkout (one game lifts out), key (the card turns over), play (activated, library behind).
export default function HowItWorks({ title = 'How It Works', blocks, covers = [] }: HowItWorksProps) {
  const steps = blocks?.length ? blocks : fallbackSteps
  const [active, setActive] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'activating' | 'done'>('idle')
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step))
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    stepRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [steps.length])

  // The last step plays its activation each time it comes into view.
  const lastStep = Math.min(steps.length, 4) - 1
  useEffect(() => {
    if (active !== lastStep) return
    const reset = setTimeout(() => setPhase('idle'), 0)
    const start = setTimeout(() => setPhase('activating'), 900)
    const finish = setTimeout(() => setPhase('done'), 2600)
    return () => {
      clearTimeout(reset)
      clearTimeout(start)
      clearTimeout(finish)
    }
  }, [active, lastStep])
  const ready = active === lastStep ? phase : 'idle'

  const [shelfA, shelfB, shelfC, shelfD, hero] = [covers[6], covers[7], covers[0], covers[8], covers[2]]
  const hasArt = Boolean(shelfA && shelfB && shelfC && shelfD && hero)
  const titleWord = hero?.title.replace(/\s*\((PC|Mac)\).*$/i, '')

  return (
    <section className="relative z-10 w-full py-18 md:py-30">
      <div className="container [--max-width-container:1240px]">
        <h2 data-display className="text-[28px] leading-[34px] font-bold tracking-[-0.4px] text-white/95 md:text-[44px] md:leading-[50px] md:tracking-[-0.8px]">
          {title.replace(/\?$/, '')}
        </h2>

        <div className="mt-6 grid grid-cols-1 lg:mt-14 lg:grid-cols-2 lg:gap-18">
          {hasArt && (
            <div className={styles.stage} aria-hidden="true">
              <div
                className={cn(
                  styles.scene,
                  ready === 'activating' && styles.activating,
                  ready === 'done' && styles.done,
                )}
                data-step={Math.min(active, 3)}
              >
                {[shelfA, shelfB, shelfC, shelfD].map((cover) => (
                  <div key={cover.handle} className={cn(styles.cover, styles.side)}>
                    <Image src={cover.image} alt="" fill sizes="200px" />
                  </div>
                ))}
                <div className={styles.flip}>
                  <div className={styles.face}>
                    <Image src={hero.image} alt="" fill sizes="200px" />
                  </div>
                  <div className={cn(styles.face, styles.back)}>
                    <span className={cn(styles.onStep2, 'inline-flex h-6 w-fit items-center rounded-full bg-[#22C55E]/12 px-2.5 text-xs font-medium text-[#4ADE80]')}>
                      Key delivered
                    </span>
                    <div className={cn(styles.onStep2, styles.keyBox)}>XXXXX-XXXXX-XXXXX</div>
                    <span className={cn(styles.onStep2, 'truncate text-xs text-white/65')}>{titleWord}</span>
                  </div>
                  <div className={cn(styles.ready, styles.onStep3)}>
                    <span className={styles.readyLabel}>{ready === 'done' ? 'Ready to play' : 'Activating'}</span>
                    <span className={styles.bar}>
                      <i />
                    </span>
                    <span className={styles.play}>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Play
                    </span>
                  </div>
                </div>
                <span className={cn(styles.onStep1, styles.checkoutTag, 'bg-primary/16 inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium text-[#7DB0FF]')}>
                  Secure checkout
                </span>
              </div>
            </div>
          )}

          <div>
            {steps.map((step, index) => (
              <div
                key={`${step.title}-${index}`}
                ref={(el) => {
                  stepRefs.current[index] = el
                }}
                data-step={index}
                className={cn(styles.step, active === index && styles.stepActive)}
              >
                <span className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-[22px] leading-7 font-bold tracking-[-0.4px] text-white/95 md:text-[28px] md:leading-[34px]">
                    {step.title}
                  </h3>
                  <p className="mt-2 mb-3 text-xs leading-4! font-bold tracking-[1.2px]! text-[#7DB0FF] uppercase">
                    {step.subtitle}
                  </p>
                  <p className="max-w-130 text-base leading-[26px]! text-white/65">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
