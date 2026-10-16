'use client'

import { startTransition, useState } from 'react'
import Image from 'next/image'
import { subscribeToNewsletter } from '@/app/actions/newsletter'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'
import { cn } from '@/lib/utils'

interface NewsletterSectionProps {
  title?: string
  description?: string
  placeholder?: string
  // Cover image URLs for the drifting wall behind the text.
  covers?: string[]
}

const COLUMN_COUNT = 6

export default function NewsletterSection({
  title = 'Stay In The Game',
  description = 'Get exclusive deals, early discounts, and instant alerts - straight to your inbox.',
  placeholder = 'yourname@mail.com',
  covers = [],
}: NewsletterSectionProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit: React.ComponentProps<'form'>['onSubmit'] = (e) => {
    e.preventDefault()

    if (!email.trim()) {
      return
    }

    setIsSubmitting(true)

    startTransition(async () => {
      const result = await subscribeToNewsletter(email)

      if (result.success) {
        toast.success(result.message)
        setEmail('')
      } else {
        toast.error(result.message)
      }

      setIsSubmitting(false)
    })
  }

  // Split the covers into columns for the drifting wall behind the text.
  const columns = Array.from({ length: COLUMN_COUNT }, (_, i) =>
    covers.filter((_, j) => j % COLUMN_COUNT === i),
  ).filter((column) => column.length > 0)

  return (
    <section className="container">
      <div className="group/newsletter border-border bg-background relative isolate overflow-hidden rounded-3xl border">
        {/* A tilted wall of real covers whose columns drift up and down
            (pausing on hover), faded to black behind the text. */}
        {columns.length > 0 && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-full md:w-[70%]"
          >
            <div className="absolute inset-x-0 -inset-y-28 flex scale-110 -rotate-6 justify-end gap-3 opacity-90">
              {columns.map((column, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex w-[120px] shrink-0 flex-col gap-3 group-hover/newsletter:[animation-play-state:paused] motion-reduce:animate-none',
                    i % 2 ? 'animate-cover-drift-down' : 'animate-cover-drift-up',
                  )}
                  style={{ animationDuration: `${38 + i * 4}s` }}
                >
                  {[...column, ...column].map((src, k) => (
                    <Image
                      key={k}
                      src={src}
                      alt=""
                      width={120}
                      height={156}
                      sizes="120px"
                      loading="lazy"
                      className="aspect-[1/1.3] w-[120px] rounded-xl object-cover object-top shadow-[0_10px_24px_rgba(0,0,0,0.5)]"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        <div
          aria-hidden
          // Solid behind the text, fading out so the covers show clearly on the right.
          className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,var(--background)_32%,color-mix(in_srgb,var(--background)_80%,transparent)_46%,color-mix(in_srgb,var(--background)_25%,transparent)_70%,transparent_100%)] max-md:bg-background/80 max-md:bg-none"
        />

        <div className="relative flex max-w-[520px] flex-col gap-5 p-8 md:p-14">
          <h2 className="trim text-[28px] leading-none font-semibold md:text-[40px]">
            {title}
          </h2>
          <p className="text-muted-foreground text-base leading-6">
            {description}
          </p>

          <form
            className="flex flex-col gap-2.5 sm:flex-row"
            onSubmit={handleSubmit}
          >
            <label className="relative sm:flex-1">
              <span className="sr-only">Email address</span>
              <Icons.MailPencil className="text-muted-foreground pointer-events-none absolute inset-y-0 left-4 m-auto size-5" />
              <input
                className="border-border placeholder:text-muted-foreground/70 focus:border-primary focus:bg-primary/5 h-[52px] w-full rounded-xl border bg-white/[0.03] pr-4 max-md:bg-background/85 pl-12 text-[15px] font-medium text-white transition-colors outline-none disabled:opacity-60"
                type="email"
                placeholder={placeholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                autoComplete="email"
                required
              />
            </label>
            <Button
              variant="primary"
              className="h-[52px] rounded-xl px-6 text-[15px] md:text-[15px]"
              type="submit"
              disabled={isSubmitting}
            >
              Subscribe
            </Button>
          </form>

          <p className="text-muted-foreground/70 text-[13px]">
            No spam. Unsubscribe any time.
          </p>
        </div>
      </div>
    </section>
  )
}
