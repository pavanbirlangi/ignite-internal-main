import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { Message, TicketConversationProps, TicketStatus } from '@/types/TicketTypes'
import { useState, useRef } from 'react'
import { ChevronLeft, Paperclip, Send, Loader2, X } from 'lucide-react'
import {
  ACCOUNT_CARD_CLASS,
  ACCOUNT_PRIMARY_BUTTON_CLASS,
  ACCOUNT_SECTION_LABEL_CLASS,
  AccountPageHeader,
  StatusPill,
  type StatusTone,
} from '@/components/library/account-ui'

const STATUS_TONE: Record<TicketStatus, StatusTone> = {
  'UNDER PROCESS': 'warning',
  REJECTED: 'danger',
  RESOLVED: 'success',
}

const STATUS_LABEL: Record<TicketStatus, string> = {
  'UNDER PROCESS': 'Under process',
  REJECTED: 'Rejected',
  RESOLVED: 'Resolved',
}

function Attachments({ files }: { files: NonNullable<Message['content']['attachments']> }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {files.map((file, i) => (
        <a
          key={i}
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-background/60 border-border flex max-w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-white/95 transition-colors hover:bg-white/10"
        >
          <Paperclip className="size-3.5 shrink-0 text-white/65" />
          <span className="truncate">{file.name}</span>
        </a>
      ))}
    </div>
  )
}

// Chat view of a HelpDesk ticket: the original request pinned on top, then your messages on the
// right and support's on the left, with the reply box at the bottom.
export function TicketConversation({
  messages,
  ticketId,
  shortId,
  status,
  openedOn,
  onReply,
  isReplying = false,
}: TicketConversationProps) {
  const [replyText, setReplyText] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    if (!onReply || (!replyText.trim() && attachments.length === 0)) return
    try {
      await onReply(replyText, attachments)
      setReplyText('')
      setAttachments([])
    } catch (error) {
      console.error('Failed to send reply:', error)
    }
  }

  const request = messages.find((msg) => msg.content.title)

  return (
    <div className="flex flex-col">
      <Link
        href="/dashboard/my-tickets"
        className="mb-3 inline-flex w-fit items-center gap-1 rounded-md text-sm text-white/65 transition-colors outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <ChevronLeft className="size-4" />
        My Tickets
      </Link>

      <AccountPageHeader
        title={shortId ? `Ticket #${shortId}` : 'Ticket Details'}
        subtitle={ticketId ? `For order #${ticketId}` : undefined}
        action={
          status && <StatusPill tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</StatusPill>
        }
      />

      {/* The original request */}
      {request && (
        <div className={cn(ACCOUNT_CARD_CLASS, 'mb-6 px-5 py-4')}>
          <h2 data-display className={cn(ACCOUNT_SECTION_LABEL_CLASS, 'mb-2')}>
            Request
          </h2>
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
            <div className="min-w-0">
              <p className="text-base font-bold text-white/95">{request.content.title}</p>
              <p className="mt-0.5 text-sm! leading-5! text-white/65">
                {[openedOn && `Opened ${openedOn}`, ticketId && `Order #${ticketId}`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            {request.content.resolutionType && (
              <span className="shrink-0 rounded-md bg-white/8 px-2 py-1 text-xs font-medium text-white/65">
                Resolution: {request.content.resolutionType}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Conversation */}
      <div className="flex flex-col gap-4">
        {messages.map((msg) => {
          if (msg.type === 'status_update') {
            return (
              <div key={msg.id} className="flex flex-col items-center gap-1.5 py-1 text-center">
                <p className="max-w-md text-xs! leading-4! text-white/65">{msg.content.text}</p>
                {msg.status === 'RESOLVED' && <StatusPill tone="success">Marked resolved</StatusPill>}
              </div>
            )
          }

          const isMine = msg.sender.role === 'user'
          return (
            <div key={msg.id} className={cn('flex flex-col', isMine ? 'items-end' : 'items-start')}>
              <p className="mb-1 text-xs! leading-4! text-white/65">
                {isMine ? 'You' : `${msg.sender.name} · Support`} · {msg.timestamp}
              </p>
              <div
                className={cn(
                  'max-w-[88%] rounded-2xl border px-3.5 py-2.5 text-sm text-white/95 sm:max-w-[78%]',
                  isMine
                    ? 'bg-primary/18 border-primary/35 rounded-br-md'
                    : 'bg-card border-border rounded-bl-md',
                )}
              >
                {msg.content.text && (
                  <p className="text-sm! leading-5! whitespace-pre-wrap">{msg.content.text}</p>
                )}
                {msg.content.attachments && msg.content.attachments.length > 0 && (
                  <Attachments files={msg.content.attachments} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Reply */}
      {onReply && (
        <div
          className={cn(
            ACCOUNT_CARD_CLASS,
            'focus-within:border-primary/50 mt-6 p-3 transition-colors',
          )}
        >
          <textarea
            aria-label="Your message"
            className="min-h-20 w-full resize-none bg-transparent px-1 py-1 text-sm text-white/95 outline-none placeholder:text-white/45"
            placeholder="Type your message here..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            disabled={isReplying}
          />

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-2">
              {attachments.map((file, i) => (
                <div
                  key={i}
                  className="bg-secondary border-border flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs text-white/95"
                >
                  <span className="max-w-40 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    aria-label={`Remove ${file.name}`}
                    className="cursor-pointer text-white/65 hover:text-white"
                    disabled={isReplying}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Attach files"
              className="grid size-9 cursor-pointer place-items-center rounded-full text-white/65 transition-colors outline-none hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
              onClick={() => fileInputRef.current?.click()}
              disabled={isReplying}
            >
              <Paperclip className="size-4.5" />
            </button>
            <input
              type="file"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={isReplying || (!replyText.trim() && attachments.length === 0)}
              aria-busy={isReplying || undefined}
              className={ACCOUNT_PRIMARY_BUTTON_CLASS}
            >
              {isReplying ? <Loader2 className="animate-spin" /> : <Send />}
              Send message
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
