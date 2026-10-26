'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ACCOUNT_INPUT_CLASS,
  ACCOUNT_PRIMARY_BUTTON_CLASS,
  ACCOUNT_SECONDARY_BUTTON_CLASS,
} from '@/components/library/account-ui'
import {
  TICKET_LABEL_CLASS,
  TICKET_TEXTAREA_CLASS,
  TicketAttachments,
} from '@/components/help/ticket/ticket-ui'

interface GlobalTicketFormProps {
  // The signed-in customer's email, filled in for them.
  defaultEmail?: string
  onSubmit: (data: { orderId: string; description: string; attachments: File[]; email: string }) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// The general ticket: no account needed. For questions that aren't about one order, or from
// visitors who aren't signed in.
export function GlobalTicketForm({ defaultEmail = '', onSubmit, onCancel, isSubmitting = false }: GlobalTicketFormProps) {
  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState(defaultEmail)
  const [description, setDescription] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [validationError, setValidationError] = useState('')

  const handleSubmit = async () => {
    if (!description.trim()) return setValidationError('Tell us what happened.')
    if (!EMAIL_PATTERN.test(email.trim())) return setValidationError('Enter an email address we can reply to.')
    setValidationError('')
    await onSubmit({ orderId: orderId.trim().replace(/^#/, ''), description, attachments, email: email.trim() })
  }

  return (
    <div className="max-w-180">
      <h1 data-display className="text-2xl leading-tight font-bold text-white/95 md:text-3xl">Send us a ticket</h1>
      <p className="mt-2 text-base text-white/65">Tell us what happened and we&apos;ll reply by email.</p>

      <div className="mt-6">
        <label htmlFor="ticket-email" className={TICKET_LABEL_CLASS}>
          Your email<span className="ml-0.5 text-[#FF6B76]">*</span>
        </label>
        <input
          id="ticket-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          placeholder="you@example.com"
          className={ACCOUNT_INPUT_CLASS}
        />
      </div>

      <div className="mt-6">
        <label htmlFor="ticket-order" className={TICKET_LABEL_CLASS}>
          Order number <span className="font-normal text-white/50">(if it&apos;s about an order)</span>
        </label>
        <input
          id="ticket-order"
          inputMode="numeric"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          disabled={isSubmitting}
          placeholder="e.g. 10001"
          className={cn(ACCOUNT_INPUT_CLASS, 'max-w-60')}
        />
      </div>

      <div className="mt-6">
        <label htmlFor="ticket-description" className={TICKET_LABEL_CLASS}>
          Tell us what happened<span className="ml-0.5 text-[#FF6B76]">*</span>
        </label>
        <textarea
          id="ticket-description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            if (validationError) setValidationError('')
          }}
          disabled={isSubmitting}
          placeholder="The more detail, the faster we can help."
          rows={5}
          className={TICKET_TEXTAREA_CLASS}
        />
      </div>

      <div className="mt-6">
        <TicketAttachments files={attachments} onChange={setAttachments} disabled={isSubmitting} />
      </div>

      {validationError ? <p className="mt-5 text-sm font-medium text-[#FF6B76]">{validationError}</p> : null}

      <div className="mt-7 flex items-center gap-3">
        <button type="button" onClick={handleSubmit} disabled={isSubmitting} className={cn(ACCOUNT_PRIMARY_BUTTON_CLASS, 'h-11 px-6')}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              Sending…
            </>
          ) : (
            'Send ticket'
          )}
        </button>
        <button type="button" onClick={onCancel} disabled={isSubmitting} className={cn(ACCOUNT_SECONDARY_BUTTON_CLASS, 'h-11 px-5')}>
          Cancel
        </button>
      </div>
    </div>
  )
}
