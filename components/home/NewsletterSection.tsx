'use client'

import { startTransition, useState } from 'react'
import Image from 'next/image'
import { subscribeToNewsletter } from '@/app/actions/newsletter'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'
import { Input } from '../ui/input'

interface NewsletterSectionProps {
  title?: string
  description?: string
  placeholder?: string
}

export default function NewsletterSection({
  title = 'Stay In The Game',
  description = 'Get exclusive deals, early discounts, and instant alerts - straight to your inbox.',
  placeholder = 'yourname@mail.com',
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

  return (
    <section className="bg-(--neutral-900) py-16 md:py-28">
      <div className="container mx-auto flex flex-col items-center gap-16 text-center [--max-width-container:992px] lg:flex-row lg:gap-24 lg:text-left">
        {/* Platform Brand Icons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Image
            src="/images/home/platform-brand-icons.svg"
            alt="Platform Brands"
            loading="lazy"
            width={348}
            height={168}
          />
        </div>

        {/* Newsletter Content */}
        <div className="flex max-w-md flex-col gap-6">
          {/* Heading */}
          <h2 className="trim text-[28px] leading-none font-semibold md:text-[2.5rem]">
            {title}
          </h2>

          {/* Email Input */}
          <form className="relative" onSubmit={handleSubmit}>
            <Icons.MailPencil className="text-muted-foreground pointer-events-none absolute inset-y-0 left-1 z-1 m-auto mx-4 size-6" />
            <Input
              className="pl-13"
              type="email"
              size="lg"
              placeholder={placeholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              autoComplete="email"
              required
            />
            <Button
              variant="ghost"
              icon={true}
              size="md"
              className="absolute inset-y-0 right-0 m-auto mx-1 rounded-full"
              type="submit"
              disabled={isSubmitting}
              aria-label="Subscribe to newsletter"
            >
              <Icons.PaperPlane className="size-6" />
            </Button>
          </form>

          {/* Description */}
          <p className="trim text-muted-foreground font-medium">
            {description}
          </p>
        </div>
      </div>
    </section>
  )
}
