'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { getValidAttachments, mergeAttachments } from '@/lib/help/ticket-form'
import Link from 'next/link'

interface GlobalTicketFormProps {
  onBack: () => void
  onSubmit: (data: {
    orderId: string
    description: string
    attachments: File[]
    email: string
  }) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function GlobalTicketForm({
  onBack,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: GlobalTicketFormProps) {
  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [validationError, setValidationError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validFiles = getValidAttachments(e.target.files)

    setAttachments((currentAttachments) =>
      mergeAttachments(currentAttachments, validFiles),
    )

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!description.trim()) {
      setValidationError('Please describe the issue.')
      return
    }
    if (!email.trim()) {
      setValidationError('Please enter your email address.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address.')
      return
    }

    setValidationError('')

    await onSubmit({
      orderId,
      description,
      attachments,
      email,
    })
  }

  return (
    <div className="mx-auto w-full max-w-[680px]">
      <div className="border-border bg-secondary/40 rounded-[20px] border p-6 md:px-10 md:py-6">
        {/* Header */}
        <div className="mb-1 flex items-center gap-3">
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className="hover:text-muted-foreground cursor-pointer text-white transition-colors disabled:opacity-50"
            aria-label="Go back"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 12H5M5 12L12 19M5 12L12 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-white md:text-[28px]">
            Create ticket
          </h1>
        </div>
        <p className="text-muted-foreground mb-8 ml-9 text-sm font-medium">
          Please provide details about the issue you are facing
        </p>

        <div className="space-y-6">
          {/* Order ID */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-white">
              Order ID
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              disabled={isSubmitting}
              placeholder="Enter the order id you are facing an issue with. Ex: F74h178"
              className="bg-secondary placeholder:text-muted-foreground focus:ring-primary w-full rounded-lg px-4 py-3.5 text-sm text-white focus:ring-1 focus:outline-none disabled:opacity-60"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-white">
              Please describe the issue you are facing
              <span className="text-red ml-0.5">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (validationError) setValidationError('')
              }}
              disabled={isSubmitting}
              placeholder="Please describe the issue in detail here"
              rows={4}
              className="bg-secondary placeholder:text-muted-foreground focus:ring-primary w-full resize-none rounded-lg px-4 py-3.5 text-sm text-white focus:ring-1 focus:outline-none disabled:opacity-60"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-white">
              Enter an email address where we can contact you
              <span className="text-red ml-0.5">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              placeholder="Enter your email address"
              className="bg-secondary placeholder:text-muted-foreground focus:ring-primary w-full rounded-lg px-4 py-3.5 text-sm text-white focus:ring-1 focus:outline-none disabled:opacity-60"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-white">
              Provide any relevant attachments to explain your issue (upto 5
              files).
            </label>
            <div
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
              className="bg-secondary hover:bg-border flex cursor-pointer items-center justify-center gap-2 rounded-lg py-4 transition-colors aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
              aria-disabled={isSubmitting}
            >
              <Upload className="size-5 text-white" />
              <span className="text-muted-foreground text-sm">
                Upload Files (max. 2MB file)
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
              disabled={isSubmitting}
            />

            {/* Attached files list */}
            {attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {attachments.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="border-border bg-secondary flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs text-white"
                  >
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeAttachment(i)
                      }}
                      disabled={isSubmitting}
                      className="hover:text-red cursor-pointer transition-colors disabled:cursor-not-allowed"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Validation Error */}
        {validationError && (
          <p className="text-red mb-4 text-sm font-medium">{validationError}</p>
        )}

        {/* Actions */}
        <div className="mt-10 flex items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 inline-flex cursor-pointer items-center gap-2 rounded-[6px] px-8 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create ticket'
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="bg-secondary hover:bg-border cursor-pointer rounded-[6px] px-8 py-3.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
