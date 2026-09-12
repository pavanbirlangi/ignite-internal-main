'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronDown, Upload, X, Loader2 } from 'lucide-react'
import {
  createTicketFormPayload,
  getValidAttachments,
  mergeAttachments,
} from '@/lib/help/ticket-form'
import type { CreateTicketFormProps } from '@/types/HelpTypes'

export function CreateTicketForm({
  order,
  onBack,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CreateTicketFormProps) {
  const router = useRouter()
  const [issue, setIssue] = useState('')
  const [description, setDescription] = useState('')
  const [resolutionType, setResolutionType] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [issueOpen, setIssueOpen] = useState(false)
  const [resolutionOpen, setResolutionOpen] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [issueOptions, setIssueOptions] = useState<string[]>([])
  const [resolutionOptions, setResolutionOptions] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchTicketOptions() {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_CMS_API_URL?.replace(/\/+$/, '') || ''
        const response = await fetch(`${baseUrl}/items/ticket_options`)
        const json = await response.json()
        if (json.data) {
          if (json.data.issue_types) {
            setIssueOptions(json.data.issue_types.map((type: { name: string }) => type.name))
          }
          if (json.data.resolution_types) {
            setResolutionOptions(json.data.resolution_types.map((type: { name: string }) => type.name))
          }
        }
      } catch (error) {
        console.error('Failed to fetch ticket options:', error)
      }
    }
    fetchTicketOptions()
  }, [])

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
    if (!issue) {
      setValidationError('Please select an issue type.')
      return
    }
    if (!description.trim()) {
      setValidationError('Please describe the issue.')
      return
    }
    setValidationError('')

    await onSubmit(
      createTicketFormPayload(
        order.id,
        issue,
        description,
        resolutionType,
        attachments,
      ),
    )
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
            Create Ticket
          </h1>
        </div>
        <p className="text-muted-foreground mb-8 ml-9 text-sm font-medium">
          Please enter the fields to describe the issue facing regarding the
          selected order.
        </p>

        {/* Selected Order Info */}
        <div className="bg-secondary/20 border-border/20 mb-8 flex flex-col items-center justify-between gap-4 rounded-[12px] border px-5 py-3 sm:flex-row">
          <div className="flex w-full items-center gap-4 sm:w-auto">
            {order.image ? (
              <div className="relative h-[79px] w-[62px] shrink-0 overflow-hidden rounded-md">
                <Image
                  src={order.image}
                  alt={order.id}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="bg-secondary h-[79px] w-[62px] shrink-0 rounded-md" />
            )}
            <div className="flex flex-col gap-1 overflow-hidden">
              <span
                className="text-[16px] font-semibold line-clamp-2 text-white md:text-[18px]"
                title={order.products}
              >
                {order.products || 'Product Name Not Available'}
              </span>
              <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Order #{order.id}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/my-orders/${order.id}`)}
            className="border-muted-foreground/30 w-full shrink-0 cursor-pointer rounded-[6px] border bg-transparent px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/5 sm:w-auto"
          >
            View Details
          </button>
        </div>

        {/* Select Issue */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-white">
            Select Issue<span className="text-red ml-0.5">*</span>
          </label>
          <div className="relative">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setIssueOpen(!issueOpen)
                setResolutionOpen(false)
              }}
              className="bg-secondary hover:bg-border flex w-full cursor-pointer items-center justify-between rounded-lg p-4 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className={issue ? 'text-white' : 'text-muted-foreground'}>
                {issue || 'Please select your issues'}
              </span>
              <ChevronDown
                className={`text-muted-foreground size-4 transition-transform ${issueOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {issueOpen && (
              <div className="border-border bg-secondary absolute z-10 mt-1 w-full overflow-hidden rounded-lg border shadow-lg">
                {issueOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setIssue(opt)
                      setIssueOpen(false)
                      setValidationError('')
                    }}
                    className="hover:bg-border block w-full cursor-pointer px-4 py-3 text-left text-sm text-white transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
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
            placeholder="Please describe the issue you are facing"
            rows={4}
            className="bg-secondary placeholder:text-muted-foreground focus:ring-primary w-full resize-none rounded-lg px-4 py-3.5 text-sm text-white focus:ring-1 focus:outline-none disabled:opacity-60"
          />
        </div>

        {/* Resolution Type */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-white">
            Resolution Type
          </label>
          <div className="relative">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setResolutionOpen(!resolutionOpen)
                setIssueOpen(false)
              }}
              className="bg-secondary hover:bg-border flex w-full cursor-pointer items-center justify-between rounded-lg px-4 py-3.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                className={
                  resolutionType ? 'text-white' : 'text-muted-foreground'
                }
              >
                {resolutionType ||
                  'Select the type of resolution you would want'}
              </span>
              <ChevronDown
                className={`text-muted-foreground size-4 transition-transform ${resolutionOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {resolutionOpen && (
              <div className="border-border bg-secondary absolute z-10 mt-1 w-full overflow-hidden rounded-lg border shadow-lg">
                {resolutionOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setResolutionType(opt)
                      setResolutionOpen(false)
                    }}
                    className="hover:bg-border block w-full cursor-pointer px-4 py-3 text-left text-sm text-white transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-8">
          <label className="mb-2 block text-sm font-semibold text-white">
            Provide any relevant attachments to explain your issue (upto 5
            files)
          </label>
          <div
            onClick={() => !isSubmitting && fileInputRef.current?.click()}
            className="bg-secondary hover:bg-border flex cursor-pointer items-center justify-center gap-2 rounded-lg py-4 transition-colors aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
            aria-disabled={isSubmitting}
          >
            <Upload className="size-5 text-white" />
            <span className="text-muted-foreground text-sm">
              Upload Files (max 2MB)
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

        {/* Validation Error */}
        {validationError && (
          <p className="text-red mb-4 text-sm font-medium">{validationError}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 inline-flex cursor-pointer items-center gap-2 rounded-[6px] px-6 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create Ticket'
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="bg-secondary hover:bg-border cursor-pointer rounded-[6px] px-6 py-3.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
