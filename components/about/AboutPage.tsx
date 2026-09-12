'use client'

import AboutHero from './AboutHero'
import HowItWorks from './HowItWorks'
import Features from './Features'
import { useAboutUs } from '@/hooks/useAboutUs'
import type { AboutUsData } from '@/lib/services/about.service'

interface AboutPageProps {
  translatedContent?: AboutUsData
}

export default function AboutPage({ translatedContent }: AboutPageProps) {
  const { data: response, isLoading, isError } = useAboutUs()

  // Use pre-translated content from server if available, otherwise use client-fetched data
  const content = translatedContent || response?.data

  if (!translatedContent && isLoading) {
    return (
      <main className="bg-background flex min-h-screen w-full flex-col">
        <div className="bg-muted/20 h-[70vh] animate-pulse" />
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <div className="bg-muted/20 mb-8 h-10 w-64 animate-pulse rounded" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-muted/20 h-44 animate-pulse rounded-[20px]"
              />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (!content || (!translatedContent && isError)) {
    return (
      <main className="bg-background flex min-h-screen w-full flex-col">
        <AboutHero />
        <HowItWorks />
        <Features />
      </main>
    )
  }

  return (
    <main className="bg-background flex min-h-screen w-full flex-col">
      <AboutHero
        title={content.title}
        description={content.description}
        buttonText={content.btn_text}
        buttonUrl={content.btn_url}
        showImage={content.show_img}
      />
      <HowItWorks
        title={content.section1_title}
        blocks={content.section1_blocks}
      />
      <Features
        title={content.section2_title}
        description={content.section2_description}
        blocks={content.section2_blocks}
      />
    </main>
  )
}

