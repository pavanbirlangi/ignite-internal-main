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
    <div className={`flex w-full flex-col gap-8 ${className ?? ''}`}>
      <h2 className="trim text-xl font-semibold md:text-2xl lg:text-[28px]">
        {title}
      </h2>
      {/* Open rows split by thin lines (like Driffle). Text sizes match the
          rest of the homepage: 16px questions like the genre labels, answers
          like the newsletter text. Hover brightens to white, as elsewhere. */}
      {/* Same 32px gap under the heading as the other sections, and a line
          above the first question so it reads as the start of the list. */}
      <Accordion
        type="single"
        collapsible
        className="border-border w-full border-t"
      >
        {items.map((item) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            className="last:border-b"
          >
            <AccordionTrigger
              className="group/faq py-6 text-base font-medium text-white/85 hover:text-white data-[state=open]:text-white"
              icon={
                // A plus that turns into a cross when open.
                <span
                  aria-hidden
                  className="text-muted-foreground pointer-events-none relative size-4 shrink-0 transition-[transform,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/faq:text-white group-data-[state=open]/faq:rotate-45 group-data-[state=open]/faq:text-white before:absolute before:top-1/2 before:left-0 before:h-0.5 before:w-4 before:-translate-y-1/2 before:rounded-full before:bg-current after:absolute after:top-0 after:left-1/2 after:h-4 after:w-0.5 after:-translate-x-1/2 after:rounded-full after:bg-current motion-reduce:transition-none"
                />
              }
            >
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <div
                className="prose prose-invert prose-p:my-0 prose-p:text-base prose-p:leading-6 prose-p:text-muted-foreground prose-a:text-primary hover:prose-a:underline text-muted-foreground max-w-none text-base leading-6"
                dangerouslySetInnerHTML={{ __html: item.answer }}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
