import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface AboutHeroProps {
  title?: string
  description?: string
  buttonText?: string
  buttonUrl?: string
  showImage?: boolean
}

export default function AboutHero({
  title = 'Powering instant access to digital entertainment.',
  description = 'Increddy is a modern digital marketplace for games, software, gift cards, and subscriptions — delivering genuine keys instantly, securely, and globally.',
  buttonText = 'Explore Our Store',
  buttonUrl = '/store',
  showImage = true,
}: AboutHeroProps) {
  const titleWords = title.trim().split(/\s+/)

  return (
    <section className="bg-background relative -mt-30 pb-16 md:min-h-svh md:pb-0">
      <img
        src="/images/about/hero-pattern.png"
        className="absolute inset-0 z-10 h-full w-full object-cover opacity-15"
      />
      <div className="from-background absolute inset-0 z-20 h-full w-full bg-linear-to-t to-[var(--background-0)] object-cover" />
      <img
        src="/images/about/hero-glow.png"
        className="absolute inset-0 z-0 h-full w-full object-cover"
      />
      <div className="relative inset-0 z-30 mt-32 flex h-full w-full flex-col items-center justify-center px-4 md:mt-50">
        <div className="flex flex-col items-center justify-center gap-6 text-center md:gap-10">
          <h1 className="text-primary max-w-201.25 text-3xl leading-tight font-semibold md:text-7xl md:leading-22">
            {titleWords.map((word, index) => (
              <span
                key={`${word}-${index}`}
                className={
                  index === 1 || index === 2 ? 'text-white' : undefined
                }
              >
                {index > 0 ? ' ' : ''}
                {word}
              </span>
            ))}
          </h1>
          <p className="text-muted-foreground max-w-148.25 text-base tracking-tight md:text-lg">
            {description}
          </p>
          <Button asChild variant="primary" size="md">
            <Link href={buttonUrl}>{buttonText}</Link>
          </Button>
        </div>
        {showImage && (
          <div className="mt-12 flex flex-row items-center justify-center md:mt-26">
            <img
              src="/images/about/hero-icons.svg"
              alt="Gaming Platform Icons"
              className="w-full max-w-100 md:max-w-none"
            />
          </div>
        )}
      </div>
    </section>
  )
}
