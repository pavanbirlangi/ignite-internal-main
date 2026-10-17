'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogTitle,
} from '@/components/ui/dialog'
import { ACCOUNT_PRIMARY_BUTTON_CLASS } from '@/components/library/account-ui'
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
        aria-describedby={undefined}
        className="bg-card border-border flex max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-2rem)] max-w-180 flex-col gap-0 overflow-hidden rounded-2xl border p-0 text-white/95 shadow-2xl sm:max-h-[86dvh]"
      >
        {/* Header */}
        <div className="border-border flex shrink-0 items-center justify-between gap-4 border-b py-4 pr-5 pl-6">
          <div className="min-w-0">
            <DialogTitle className="text-xl font-bold">Activation guide</DialogTitle>
            {title && <p className="mt-0.5 text-xs! leading-4! font-medium text-white/65">{title}</p>}
          </div>
          <DialogClose
            aria-label="Close"
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-white/5 text-white/65 transition-colors outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <XIcon className="size-4.5" />
          </DialogClose>
        </div>

        {/* Steps: a thin dark scrollbar instead of the browser's white one */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 [scrollbar-color:rgb(255_255_255/0.18)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/18 [&::-webkit-scrollbar-track]:bg-transparent">
          {/* No placeholder/sample steps in the empty case on purpose: this
              previously rendered hardcoded dummy instructions ("Instruction
              line with some bold text here"), which a real customer would
              see on any product whose activation_guide_html hasn't been
              filled in yet -- same trap as the fake review badge removed
              earlier. An honest empty state is better than invented steps
              for a key the customer actually paid for. */}
          {guideHtml ? (
            <div
              className="dynamicText max-w-none text-white/95 [&_a]:font-medium [&_a]:text-[#7DB0FF] [&_a]:no-underline! [&_a:hover]:underline! [&_img]:mt-1 [&_img]:mb-4.5 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-[10px] [&_img]:border [&_img]:border-border [&_p]:mb-3 [&_p]:text-[15px] [&_p]:leading-6 [&_p]:text-white/95 [&_u]:no-underline [&_video]:rounded-[10px]"
              dangerouslySetInnerHTML={{ __html: guideHtml }}
            />
          ) : (
            <p className="text-sm text-white/65">
              Activation steps for this product aren&apos;t available yet. If
              you need help redeeming your key, please contact support.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-border flex shrink-0 items-center justify-between gap-4 border-t px-6 py-3.5">
          {guideLink ? (
            <a
              href={guideLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white/65 transition-colors hover:text-white"
            >
              <ExternalLink className="size-3.5" />
              Publisher&apos;s guide
            </a>
          ) : (
            <span />
          )}
          <DialogClose className={ACCOUNT_PRIMARY_BUTTON_CLASS}>Done</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
