'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ContactCard from './ContactCard'
import { useContactUs } from '@/hooks/useContactUs'
import type { ContactUsResponse } from '@/lib/services/help.service'

interface ContactPageProps {
  translatedContent?: ContactUsResponse['data']
}

export default function ContactPage({ translatedContent }: ContactPageProps) {
  const { data: response, isLoading } = useContactUs()

  // Use pre-translated content from server if available, otherwise use client-fetched data
  const content = translatedContent || response?.data

  if (!translatedContent && isLoading) {
    return (
      <div className="container animate-pulse py-20 [--max-width-container:1280px] lg:py-28">
        <div className="mx-auto mb-16 flex flex-col items-center gap-4 text-center md:mb-20">
          <div className="bg-muted/30 h-16 w-64 rounded" />
          <div className="bg-muted/20 h-6 w-96 rounded" />
        </div>
        <div className="max-w-container mx-auto mb-16 grid grid-cols-1 gap-5 sm:grid-cols-2 md:mb-40 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-muted/20 h-40 rounded-[20px]" />
          ))}
        </div>
        <div className="bg-muted/20 mx-auto h-48 max-w-[752px] rounded-[20px]" />
      </div>
    )
  }

  if (!content) {
    return (
      <div className="text-muted-foreground container py-20 text-center">
        Failed to load contact information.
      </div>
    )
  }

  return (
    <div className="container py-20 [--max-width-container:1280px] lg:py-28">
      {/* Header */}
      <div className="mx-auto mb-16 flex flex-col items-center gap-4 text-center md:mb-20">
        <h1 className="text-4xl leading-tight font-semibold text-white capitalize md:text-[72px] md:leading-[88px]">
          {content.heading}
        </h1>
        <p className="text-muted-foreground text-[18px] leading-[23px]">
          {content.description}
        </p>
      </div>

      {/* Contact Cards */}
      <div className="max-w-container mx-auto mb-16 grid grid-cols-1 gap-5 sm:grid-cols-2 md:mb-40 lg:grid-cols-3">
        {content.contact_types?.map((type, idx) => (
          <ContactCard
            key={idx}
            title={type.title}
            description={type.text}
            email={type.contact_email}
          />
        ))}
      </div>

      {/* CTA — Still Experiencing Issues */}
      <div className="bg-secondary/40 mx-auto flex max-w-[752px] flex-col items-center gap-3 rounded-[20px] px-10 pt-8 pb-10 text-center">
        <h2 className="text-xl md:text-[28px] leading-tight md:leading-[36px] font-semibold text-white">
          {content.bottom_text_title}
        </h2>
        <p className="text-muted-foreground max-w-[418px] text-[14px] leading-[18px] font-medium">
          {content.bottom_text_desc}
        </p>
        <Button
          asChild
          className="mt-1 h-[40px] py-3.75 rounded-[6px] px-6 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
          variant="primary"
        >
          <Link href={content.cta_url || '/help/create-ticket'}>
            {content.cta_text}
          </Link>
        </Button>
      </div>
    </div>
  )
}

