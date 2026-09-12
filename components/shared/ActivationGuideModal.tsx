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
import { XIcon } from 'lucide-react'

export function ActivationGuideModal({
  children,
  open,
  onOpenChange,
  title,
  guideHtml,
}: {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  guideHtml?: string
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
            <h2 className="text-xl leading-7 font-semibold tracking-wide text-white sm:text-[32px] sm:leading-[42px]">
              Activation Guide
            </h2>
            <DialogClose className="absolute top-1/2 right-2 flex h-7.75 w-[31px] -translate-y-1/2 items-center focus:outline-none justify-center text-white transition-colors hover:border-white hover:bg-white/10">
              <XIcon
                color="var(--muted-foreground)"
                className="text-muted-foreground h-5 w-5 "
                strokeWidth={2.5}
              />
            </DialogClose>
          </div>

          {/* Content Body */}
          <div className="no-scrollbar mx-auto flex w-full max-w-[880px] flex-1 flex-col gap-6 overflow-y-auto px-4 pt-4 pb-6 text-white sm:gap-8 sm:px-10 sm:pt-[8px] sm:pb-10">
            {/* <h3 className="text-lg leading-[24px] font-bold sm:text-[24px] sm:leading-[32px]">
              {title ?? 'How to Activate a Steam Game Key'}
            </h3> */}

            {guideHtml ? (
              <div
                className="dynamicText prose-invert prose-lg max-w-none text-white [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl"
                dangerouslySetInnerHTML={{ __html: guideHtml }}
              />
            ) : (
              <>
                {/* Step 1 */}
                <div className="flex flex-col gap-4 sm:gap-6">
                  <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                    <div className="bg-secondary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white sm:h-[54px] sm:w-[54px] sm:text-[24px]">
                      1
                    </div>
                    <p className="text-sm leading-5 sm:text-[24px] sm:leading-[31px]">
                      Instruction line with{' '}
                      <span className="font-semibold">some bold text here</span>{' '}
                      and rest of the instruction
                    </p>
                  </div>
                </div>
                {/* ... other steps ... */}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
