'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogTitle,
} from '@/components/ui/dialog'
import { VisuallyHidden } from 'radix-ui'
import { ExternalLink, XIcon } from 'lucide-react'

export function ActivationGuideModal({
  children,
  open,
  onOpenChange,
  title,
  guideHtml,
  guideLink,
}: {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  guideHtml?: string
  guideLink?: string | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        showCloseButton={false}
        className="bg-secondary h-auto max-h-[calc(100dvh-1.5rem)] w-[92vw] max-w-[920px] overflow-hidden rounded-2xl border border-white/10 p-0 shadow-2xl backdrop-blur-2xl sm:max-h-[92dvh] sm:w-[90vw] sm:rounded-[30px]"
      >
        <VisuallyHidden.Root>
          <DialogTitle>Activation Guide</DialogTitle>
        </VisuallyHidden.Root>
        <div className="flex h-full max-h-[calc(100dvh-1.5rem)] flex-col sm:max-h-[92dvh]">
          {/* Header */}
          <div className="border-secondary relative flex h-auto min-h-[48px] shrink-0 items-center border-b px-4 pt-6 sm:px-10 md:pt-10">
            <h2 className="text-xl font-bold text-white/95 sm:text-3xl">
              Activation Guide
            </h2>
            <DialogClose className="absolute top-1/2 right-2 flex h-7.75 w-[31px] -translate-y-1/2 items-center focus:outline-none justify-center text-white/95 transition-colors hover:border-white hover:bg-white/10">
              <XIcon
                color="var(--muted-foreground)"
                className="text-white/65 h-5 w-5 "
                strokeWidth={2.5}
              />
            </DialogClose>
          </div>

          {/* Content Body */}
          <div className="no-scrollbar mx-auto flex w-full max-w-[880px] flex-1 flex-col gap-6 overflow-y-auto px-4 pt-4 pb-6 text-white/95 sm:gap-8 sm:px-10 sm:pt-[8px] sm:pb-10">
            {/* <h3 className="text-xl font-bold sm:text-2xl">
              {title ?? 'How to Activate a Steam Game Key'}
            </h3> */}

            {/* No placeholder/sample steps in the empty case on purpose: this
                previously rendered hardcoded dummy instructions ("Instruction
                line with some bold text here"), which a real customer would
                see on any product whose activation_guide_html hasn't been
                filled in yet -- same trap as the fake review badge removed
                earlier. An honest empty state is better than invented steps
                for a key the customer actually paid for. */}
            {guideLink && (
              <a
                href={guideLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex w-fit items-center gap-1.5 text-sm font-bold underline hover:opacity-80"
              >
                View the publisher&apos;s own guide
                <ExternalLink className="size-3.5" />
              </a>
            )}

            {guideHtml ? (
              <div
                className="dynamicText prose-invert prose-lg max-w-none text-white/95 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl [&_video]:rounded-xl"
                dangerouslySetInnerHTML={{ __html: guideHtml }}
              />
            ) : !guideLink ? (
              <p className="text-white/65 text-sm">
                Activation steps for this product aren&apos;t available yet. If
                you need help redeeming your key, please contact support.
              </p>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
