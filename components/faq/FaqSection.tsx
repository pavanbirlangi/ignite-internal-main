'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { FaqItem } from '@/lib/services/faq.service'

interface FaqSectionProps {
  title: string
  items: FaqItem[]
  className?: string
}

export default function FaqSection({
  title,
  items,
  className,
}: FaqSectionProps) {
  if (!items.length) return null

  return (
    <div className={`w-full ${className ?? ''}`}>
      <h2 className="trim mb-6 text-lg font-semibold md:text-[20px] lg:text-2xl">
        {title}
      </h2>
      <Accordion
        type="single"
        collapsible
        className="bg-card w-full rounded-2xl border px-5 md:px-6"
      >
        {items.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>
              <div
                className="prose prose-invert prose-sm prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-primary hover:prose-a:underline max-w-none"
                dangerouslySetInnerHTML={{ __html: item.answer }}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
