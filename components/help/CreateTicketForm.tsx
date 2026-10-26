'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ACCOUNT_PRIMARY_BUTTON_CLASS,
  ACCOUNT_SECONDARY_BUTTON_CLASS,
} from '@/components/library/account-ui'
import {
  TICKET_LABEL_CLASS,
  TICKET_TEXTAREA_CLASS,
  TicketAttachments,
  TicketOrderLine,
  ticketChipClass,
} from '@/components/help/ticket/ticket-ui'
import { createTicketFormPayload } from '@/lib/help/ticket-form'
import { suggestedTicketIssue } from '@/lib/help/help-links'
import type { CreateTicketFormProps } from '@/types/HelpTypes'

type TicketOptions = { issues: string[]; resolutions: string[] }

// The issue and resolution choices are edited in Directus (`ticket_options`).
async function fetchTicketOptions(): Promise<TicketOptions> {
  const baseUrl = process.env.NEXT_PUBLIC_CMS_API_URL?.replace(/\/+$/, '') || ''
  const json = await fetch(`${baseUrl}/items/ticket_options`).then((r) => r.json())
  const names = (list?: { name: string }[]) => (list ?? []).map((item) => item.name).filter(Boolean)
  return { issues: names(json?.data?.issue_types), resolutions: names(json?.data?.resolution_types) }
}

// Step 2 of an order ticket: the order, what's wrong (suggested from the topic the customer read),
// what happened, the wished resolution, and files.
export function CreateTicketForm({
  order,
  topic,
  onChangeOrder,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CreateTicketFormProps) {
  const [options, setOptions] = useState<TicketOptions>({ issues: [], resolutions: [] })
  const [issue, setIssue] = useState('')
  const [description, setDescription] = useState('')
  const [resolutionType, setResolutionType] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchTicketOptions()
      .then((loaded) => {
        if (cancelled) return
        setOptions(loaded)
        setIssue((current) => current || suggestedTicketIssue(topic?.issueTypeSlug, loaded.issues))
      })
      .catch((error) => console.error('Failed to fetch ticket options:', error))
    return () => {
      cancelled = true
    }
  }, [topic?.issueTypeSlug])

  const handleSubmit = async () => {
    if (!issue) return setValidationError("Choose what's wrong.")
    if (!description.trim()) return setValidationError('Tell us what happened.')
    setValidationError('')
    await onSubmit(createTicketFormPayload(order.id, issue, description, resolutionType, attachments))
  }

  return (
    <div className="max-w-180">
      <h1 data-display className="text-2xl leading-tight font-bold text-white/95 md:text-3xl">Create a ticket</h1>
      <p className="mt-2 text-base text-white/65">
        We&apos;ll email you when we reply, and the conversation shows in My tickets.
      </p>

      <div className="mt-6">
        <span className={TICKET_LABEL_CLASS}>Order</span>
        <TicketOrderLine
          order={order}
          action={
            <button
              type="button"
              onClick={onChangeOrder}
              disabled={isSubmitting}
              className="shrink-0 cursor-pointer px-1 text-sm font-medium text-[#5B93F0] hover:underline disabled:opacity-50"
            >
              Change
            </button>
          }
        />
      </div>

      <fieldset className="mt-6" disabled={isSubmitting}>
        <legend className={TICKET_LABEL_CLASS}>
          What&apos;s wrong?<span className="ml-0.5 text-[#FF6B76]">*</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {options.issues.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={issue === option}
              onClick={() => {
                setIssue(option)
                setValidationError('')
              }}
              className={ticketChipClass(issue === option)}
            >
              {option}
            </button>
          ))}
        </div>
        {topic ? <p className="mt-2 text-xs text-white/50">From the help topic you read: {topic.title}</p> : null}
      </fieldset>

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
          placeholder="e.g. Steam says the key is invalid. A screenshot of the message helps."
          rows={5}
          className={TICKET_TEXTAREA_CLASS}
        />
      </div>

      {options.resolutions.length > 0 ? (
        <fieldset className="mt-6" disabled={isSubmitting}>
          <legend className={TICKET_LABEL_CLASS}>
            What would you like? <span className="font-normal text-white/50">(optional)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {options.resolutions.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={resolutionType === option}
                onClick={() => setResolutionType(resolutionType === option ? '' : option)}
                className={ticketChipClass(resolutionType === option)}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="mt-6">
        <TicketAttachments files={attachments} onChange={setAttachments} disabled={isSubmitting} />
      </div>

      {validationError ? <p className="mt-5 text-sm font-medium text-[#FF6B76]">{validationError}</p> : null}

      <div className="mt-7 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={cn(ACCOUNT_PRIMARY_BUTTON_CLASS, 'h-11 px-6')}
        >
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
