import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import LeftArrowIcon from '../icons/LeftArrowIcon'
import type { TicketConversationProps } from '@/types/TicketTypes'
import { useState, useRef } from 'react'
import { Paperclip, Send, Loader2, X } from 'lucide-react'

export function TicketConversation({
  messages,
  ticketId,
  shortId,
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

  return (
    <div className="flex flex-col space-y-6 md:space-y-8">
      {/* Header Section */}
      <div className="flex items-start gap-2">
        <Link
          href="/dashboard/my-tickets"
          className="inline-flex items-center py-1 text-white transition-colors hover:opacity-75"
        >
          <LeftArrowIcon className="size-5 md:size-6" />
        </Link>
        <div className="flex flex-col gap-1 md:gap-2">
          <h2 className="flex items-center gap-3 text-2xl font-semibold text-white md:gap-4 md:text-[28px]">
            Ticket Details
            {shortId && (
              <span className="text-muted-foreground text-base font-normal">
                #{shortId}
              </span>
            )}
          </h2>
          <p className="text-muted-foreground text-xs font-medium md:text-sm">
            Read details regarding ticket raised for order ID{' '}
            <span className="decoration-muted-foreground/50 underline underline-offset-4">
              #{ticketId}
            </span>
          </p>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="space-y-8 md:space-y-12">
        {messages.map((msg) => (
          <div key={msg.id} className="relative">
            <div className="flex flex-col gap-3 md:gap-4">
              {/* Header Row: Avatar + Name/Time */}
              <div
                className={cn(
                  'flex items-center gap-3 md:gap-4',
                  msg.sender.role === 'support' && 'flex-row-reverse',
                )}
              >
                <Avatar className="bg-primary grid size-10 place-items-center md:size-14">
                  {msg.sender.avatar ? (
                    <AvatarImage
                      src={msg.sender.avatar}
                      alt={msg.sender.name}
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary text-xs font-bold text-white md:text-sm">
                    {msg.sender.initials ||
                      (msg.sender.role === 'user' ? 'U' : 'S')}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={cn(
                    'flex flex-col',
                    msg.sender.role === 'support' && 'items-end',
                  )}
                >
                  <span className="text-sm font-semibold text-white md:text-base">
                    {msg.sender.name}
                  </span>
                  <span className="text-muted-foreground mt-0.5 text-[10px] font-medium md:mt-1 md:text-xs">
                    {msg.timestamp}
                  </span>
                </div>
              </div>

              {/* Message Content Row */}
              <div
                className={cn(
                  'flex w-full',
                  msg.sender.role === 'support' && 'justify-end',
                )}
              >
                {/* Standard Message Type */}
                {msg.type === 'message' && (
                  <div
                    className={cn(
                      'bg-secondary space-y-3 px-5 py-4 md:space-y-4 md:px-6 md:py-5',
                      'w-full',
                      msg.sender.role === 'user'
                        ? 'rounded-tr-3xl rounded-br-3xl rounded-bl-3xl'
                        : 'rounded-tl-3xl rounded-br-3xl rounded-bl-3xl',
                    )}
                  >
                    {msg.content.title && (
                      <div className="flex flex-col gap-2 pb-2 md:gap-3 md:pb-3">
                        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                          <h3 className="text-base font-semibold text-white md:text-[18px]">
                            {msg.content.title}
                          </h3>
                          {msg.content.resolutionType && (
                            <span className="text-muted-foreground text-xs font-semibold whitespace-nowrap underline md:text-sm">
                              Resolution Type: {msg.content.resolutionType}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-[11px] leading-relaxed font-medium tracking-[0.01em] whitespace-pre-wrap md:text-[12px]">
                          {msg.content.text}
                        </p>
                      </div>
                    )}

                    {!msg.content.title && (
                      <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap md:text-base">
                        {msg.content.text}
                      </p>
                    )}

                    {msg.content.attachments &&
                      msg.content.attachments.length > 0 && (
                        <div className="mt-3 space-y-2 md:mt-4 md:space-y-3">
                          <div className="bg-muted-foreground/30 h-px w-full" />
                          <p className="text-muted-foreground text-[11px] font-medium tracking-[0.01em] md:text-[12px]">
                            Attachments:
                          </p>
                          <div className="flex flex-wrap gap-2 md:gap-3">
                            {msg.content.attachments.map((file, i) => (
                              <a
                                key={i}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-background/50 flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 transition-colors hover:bg-white/10"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-muted-foreground shrink-0"
                                >
                                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                </svg>
                                <span className="text-xs font-medium text-white md:text-sm line-clamp-1">
                                  {file.name}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Status Update Type */}
                {msg.type === 'status_update' && (
                  <div className="border-border bg-secondary w-[92%] space-y-3 rounded-tl-3xl rounded-br-3xl rounded-bl-3xl border p-5 sm:w-[85%] md:w-[75%] md:space-y-4 md:p-6 lg:max-w-[800px]">
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap md:text-base">
                      {msg.content.text}
                    </p>
                    <div className="bg-muted-foreground/30 h-px w-full" />
                    {msg.status === 'RESOLVED' && (
                      <span className="bg-destructive inline-block rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide text-white uppercase md:px-3 md:py-2 md:text-sm">
                        Marked Resolved
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Section */}
      {onReply && (
        <div className="pt-4 md:mt-8 md:pt-0">
          <div className="bg-secondary focus-within:border-primary/30 focus-within:ring-primary/30 relative rounded-3xl border border-white/5 p-1 transition-all focus-within:ring-1 md:rounded-4xl md:p-2">
            <textarea
              className="min-h-24 w-full resize-none border-none bg-transparent px-4 py-3 text-sm text-white placeholder-white/40 focus:ring-0 focus:outline-none md:min-h-32 md:px-6 md:py-4 md:text-base"
              placeholder="Type your message here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={isReplying}
            />

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 pb-2 md:px-6">
                {attachments.map((file, i) => (
                  <div
                    key={i}
                    className="bg-secondary flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-white md:px-3 md:py-1.5 md:text-xs"
                  >
                    <span className="max-w-32 truncate md:max-w-40">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="text-muted-foreground hover:text-white"
                      disabled={isReplying}
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between px-4 pb-3 md:px-6 md:pb-4">
              <div className="flex items-center gap-3 md:gap-4">
                <button
                  type="button"
                  className="text-muted-foreground transition-colors hover:text-white"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isReplying}
                >
                  <Paperclip className="size-4 md:size-5" />
                </button>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>

              <button
                onClick={handleSend}
                disabled={
                  isReplying || (!replyText.trim() && attachments.length === 0)
                }
                className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold text-white transition-all disabled:opacity-50 md:px-6 md:text-sm"
              >
                {isReplying ? (
                  <Loader2 className="size-3 animate-spin md:size-4" />
                ) : (
                  <Send className="size-3 md:size-4" />
                )}
                <span className="hidden sm:inline">Send Message</span>
                <span className="inline sm:hidden">Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
