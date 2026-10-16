'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Input } from '../ui/input'
import SearchIcon from '../icons/SearchIcon'
import SearchSuggestions from './SearchSuggestions'
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions'
import { buildProductRoute } from '@/lib/search/search-utils'
import type { ProductListItem } from '@/types/product'

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
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const bannerUrl = `${process.env.NEXT_PUBLIC_CMS_API_URL}/assets/${heroBanner}`

  const headingWords = heading.trim().split(/\s+/)
  const headingLastWord = headingWords.at(-1) ?? ''
  const headingLead = headingWords.slice(0, -1).join(' ')

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

  const selectProduct = (product: ProductListItem) => {
    setIsOpen(false)
    router.push(buildProductRoute(product))
  }

  const {
    inputValue,
    setInputValue,
    activeIndex,
    debouncedQuery,
    suggestions,
    suggestionsOpen,
    isLoading,
    handleKeyDown: handleSuggestionKeys,
  } = useSearchSuggestions({
    open: isOpen,
    onSelectProduct: selectProduct,
    onSearchAll: navigateToStore,
  })

  // Suggestions close on a click anywhere outside the search box.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleSuggestionKeys(e)
    if (e.key === 'Escape') setIsOpen(false)
  }

  return (
    <section className="relative z-10 -mt-30 -mb-16 pt-30 pb-16">
      {/* Background: settles in from a slight zoom; darker on the left so the text always reads. */}
      {/* Clipped here rather than on the section, so the search suggestions can hang below. */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          alt="Hero Background"
          src={bannerUrl}
          fill
          priority
          fetchPriority="high"
          className="object-cover object-top"
        />
        {/* The same single top-to-bottom fade the site already used -- an added left-to-right
            darkening looked like an improvement in isolation but actually washed out the art
            underneath compared to the live site; this image doesn't need extra help to read. */}
        <div className="from-background/20 to-background absolute inset-0 bg-linear-to-b" />
      </div>

      <div className="container flex flex-col gap-10 pt-16 md:pt-30">
        {/* Hero Text */}
        <div className="trim leading-tight tracking-wide">
          {/* No decorative line before this: it read as a dash-like accent, which looks
              AI-generated to the client, so the label stands on its own. */}
          <p
            className="mb-3 text-sm font-bold text-white/80 uppercase sm:text-base"
          >
            {smallText}
          </p>
          <h1
            className="text-3xl font-semibold md:text-[36px] lg:text-[44px]"
          >
            {/* The last word in a solid accent colour, not a gradient: with this font, a
                gradient clipped to the text (bg-clip-text) cut the top off "?" and other
                glyphs that draw slightly above the trimmed line box (see the `trim` class on
                the wrapper above) -- there's nothing to paint where the gradient doesn't
                reach, so that sliver of ink turned invisible. A plain color has no such box. */}
            {headingLead && `${headingLead} `}
            <span className="text-[#8DB2F8]">{headingLastWord}</span>
          </h1>
        </div>

        <div className="flex max-w-2xl flex-col gap-5">
          {/* Search Bar, with live suggestions like the header search */}
          <div
            ref={containerRef}
            className="relative z-20"
          >
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
              onChange={(e) => {
                setInputValue(e.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              role="combobox"
              aria-expanded={suggestionsOpen}
              aria-controls="hero-search-results"
              aria-activedescendant={
                activeIndex >= 0
                  ? `hero-search-option-${activeIndex}`
                  : undefined
              }
              className="focus-visible:border-primary/70 border-white/20 pl-13.5 font-medium transition-[border-color,box-shadow] duration-200 placeholder:font-medium hover:border-white/35 focus-visible:shadow-[0_0_0_1px_rgba(36,104,223,0.5),0_0_36px_-6px_rgba(36,104,223,0.85)] focus-visible:ring-0"
              placeholder="Search for games, software & more"
              aria-label="Search products"
              autoComplete="off"
            />
            {suggestionsOpen && (
              <div id="hero-search-results">
                <SearchSuggestions
                  suggestions={suggestions}
                  isLoading={isLoading}
                  query={debouncedQuery}
                  onSelect={selectProduct}
                  onSearchAll={() => navigateToStore(inputValue)}
                  activeIndex={activeIndex}
                  idPrefix="hero-search-option"
                />
              </div>
            )}
          </div>

          {/* Feature Badges */}
          <div
            className="flex flex-wrap gap-2.5"
          >
            {keyPoints
              .filter((point) => point.text?.trim())
              .map((point, index) => (
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

        {/* CTA Button: a light sweep and a sliding arrow on hover */}
        <Button
          variant="primary"
          size="lg"
          className="group/cta relative w-fit min-w-48 overflow-hidden rounded-[12px] px-6 py-5 font-semibold"
          asChild
        >
          <Link href={btnUrl}>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/4 -translate-x-full skew-x-[-20deg] bg-white/25 blur-[2px] transition-transform duration-700 ease-out group-hover/cta:translate-x-[700%] motion-reduce:hidden"
            />
            {btnText}
            <ArrowRight className="size-4 transition-transform duration-300 ease-out group-hover/cta:translate-x-1" />
          </Link>
        </Button>
      </div>
    </section>
  )
}

// A trust point as a small glass chip, matching the header's glass.
function FeatureBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-bold backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/10 [&>svg]:size-4">
      {children}
    </div>
  )
}
