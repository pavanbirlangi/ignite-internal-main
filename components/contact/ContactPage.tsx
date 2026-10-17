'use client'

import { ArrowRight, Ticket } from 'lucide-react'
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
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="text-white/65 container py-20 text-center">
        Failed to load contact information.
      </div>
    )
  }

  return (
    <div className="bg-[radial-gradient(50%_60%_at_85%_10%,rgb(36_104_223/0.22),transparent_70%)]">
      <div className="container pb-24 [--max-width-container:1240px]">
        {/* Header with the ticket card beside it: purchase problems are why most people come here */}
        <div className="grid grid-cols-1 items-center gap-7 py-10 md:py-18 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-14">
          <div>
            <p className="mb-3.5 text-xs leading-4! font-bold tracking-[1.2px]! text-white/65 uppercase">Support</p>
            <h1 data-display className="text-[36px] leading-[42px] font-bold tracking-[-0.6px] text-white/95 md:text-[56px] md:leading-[62px] md:tracking-[-1.2px]">
              {content.heading}
            </h1>
            <p className="mt-4 max-w-120 text-base leading-[26px]! text-white/65 md:text-[18px] md:leading-7!">
              {content.description}
            </p>
          </div>

          <div className="border-primary/35 rounded-2xl border bg-[radial-gradient(80%_100%_at_100%_0%,rgb(36_104_223/0.25),transparent_60%),var(--card)] p-6 md:p-7">
            <span className="bg-primary/16 grid size-11 place-items-center rounded-xl text-[#7DB0FF]">
              <Ticket className="size-5" />
            </span>
            <h2 data-display className="mt-4.5 text-2xl leading-[30px] font-bold text-white/95">
              {content.bottom_text_title}
            </h2>
            <p className="mt-1.5 text-[15px] leading-6! text-white/65">{content.bottom_text_desc}</p>
            <Link
              href={content.cta_url || '/help/create-ticket'}
              className="group/cta bg-primary relative mt-5.5 inline-flex h-11 items-center gap-2 overflow-hidden rounded-lg px-4.5 text-sm font-medium text-white shadow-[0_10px_30px_-8px_var(--primary-glow-60)] transition-all outline-none hover:-translate-y-px hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <span
                aria-hidden
                className="absolute inset-y-0 -left-1/2 w-2/5 -skew-x-20 bg-white/25 transition-transform duration-700 group-hover/cta:translate-x-[360%] motion-reduce:hidden"
              />
              {content.cta_text}
              <ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Teams */}
        <div>
          {content.contact_types?.map((type, idx) => (
            <ContactCard
              key={idx}
              index={idx}
              title={type.title}
              description={type.text}
              email={type.contact_email}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
