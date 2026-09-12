'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Input } from '../ui/input'
import SearchIcon from '../icons/SearchIcon'

interface HeroSectionProps {
  smallText: string
  heading: string
  keyPoints: Array<{
    icon: string
    text: string
  }>
  btnText: string
  btnUrl: string
  heroBanner: string
}

export default function HeroSection({
  smallText,
  heading,
  keyPoints,
  btnText,
  btnUrl,
  heroBanner,
}: HeroSectionProps) {
  const router = useRouter()
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const bannerUrl = `${process.env.NEXT_PUBLIC_CMS_API_URL}/assets/${heroBanner}`

  const navigateToStore = useCallback(
    (q: string) => {
      setIsOpen(false)
      if (q.trim()) {
        router.push(`/store?q=${encodeURIComponent(q.trim())}`)
      } else {
        router.push('/store')
      }
    },
    [router],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigateToStore(inputValue)
    }
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <section className="relative z-10 -mt-30 -mb-16 overflow-hidden pt-30 pb-16">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <Image
          alt="Hero Background"
          src={bannerUrl}
          fill
          priority
          fetchPriority="high"
          className="object-cover object-top"
        />
        <div className="from-background/20 to-background absolute inset-0 bg-linear-to-b" />
      </div>

      <div className="container mx-auto flex flex-col gap-10 px-4 pt-16 [--max-width-container:1240px] md:pt-30">
        {/* Hero Text */}
        <div className="trim text-[2rem] leading-tight tracking-wide">
          <p className="mb-2 text-sm font-bold sm:text-base md:text-2xl">
            {smallText}
          </p>
          <h1 className="text-2xl font-semibold md:text-[28px] lg:text-[32px]">
            {heading}
          </h1>
        </div>

        <div className="flex max-w-2xl flex-col gap-6">
          {/* Search Bar */}
          <div ref={containerRef} className="relative">
            <button
              type="button"
              onClick={() => navigateToStore(inputValue)}
              aria-label="Search"
              className="pointer-events-auto absolute inset-y-0 left-5 z-1 m-auto flex items-center"
            >
              <SearchIcon className="text-muted-foreground size-6" />
            </button>
            <Input
              type="text"
              size="xl"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-13.5 font-medium placeholder:font-medium"
              placeholder="Search for games, software & more"
              aria-label="Search products"
              autoComplete="off"
            />
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-6 md:justify-between">
            {keyPoints.map((point, index) => (
              <FeatureBadge key={index}>
                <div
                  className="size-4 [&>svg]:size-full"
                  dangerouslySetInnerHTML={{ __html: point.icon }}
                />
                <span className="trim font-medium">{point.text}</span>
              </FeatureBadge>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <Button
          variant="primary"
          size="lg"
          className="w-fit min-w-48 rounded-[12px] px-4 py-5 font-semibold"
          asChild
        >
          <Link href={btnUrl}>{btnText}</Link>
        </Button>
      </div>
    </section>
  )
}

function FeatureBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm font-bold [&>svg]:size-4">
      {children}
    </div>
  )
}
