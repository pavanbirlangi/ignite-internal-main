'use client'

import * as React from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import Pagination from '@/components/store/Pagination'
import { ACCOUNT_SECTION_LABEL_CLASS } from '@/components/library/account-ui'
import { parseCredentialKey } from '@/lib/orders/parse-credential-key'

interface KeyListProps {
  keys: string[]
}

export const KeyList = ({ keys }: KeyListProps) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const keysPerPage = 5

  const totalPages = Math.ceil(keys.length / keysPerPage)
  const startIndex = (currentPage - 1) * keysPerPage
  const currentKeys = keys.slice(startIndex, startIndex + keysPerPage)

  const handleCopy = (value: string, id: string) => {
    navigator.clipboard.writeText(value)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // compact: just the icon on phones (rows inside an account card), the word from sm up.
  const renderCopyButton = (value: string, id: string, title: string, size: 'md' | 'sm' = 'md', text = 'Copy', compact = false) => {
    const copied = copiedId === id
    return (
      <button
        type="button"
        onClick={() => handleCopy(value, id)}
        aria-label={title}
        className={cn(
          'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/40',
          size === 'md' ? 'h-10 px-3 text-sm' : 'h-8 px-2.5 text-[13px]',
          compact && 'px-2 sm:px-2.5',
          copied ? 'bg-[#22C55E]/12 text-[#4ADE80]' : 'bg-secondary text-white/95 hover:bg-white/10',
        )}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        <span className={cn(compact && 'sr-only sm:not-sr-only')}>{copied ? 'Copied' : text}</span>
      </button>
    )
  }

  // An account login: one card per account ("Account 2 of 3" + Copy both), Email and Password as
  // rows inside it, so several logins read as separate accounts rather than a list of fields.
  const renderCredential = (email: string, password: string, globalIndex: number) => {
    const title = keys.length > 1 ? `Account ${globalIndex + 1} of ${keys.length}` : 'Account'
    const row = (label: string, value: string, id: string, copyTitle: string) => (
      // Phones: the label sits above the value, so the value gets the whole width.
      <div className="flex items-center gap-3 py-2 pr-2 pl-4">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
          <span className="text-xs text-white/55 sm:w-[84px] sm:shrink-0 sm:text-[13px]">{label}</span>
          <span className="font-mono text-sm font-medium tracking-[0.4px] break-all text-white/95 sm:text-[15px]">
            {value}
          </span>
        </div>
        {renderCopyButton(value, id, copyTitle, 'sm', 'Copy', true)}
      </div>
    )
    return (
      <div className="bg-background border-border overflow-hidden rounded-xl border">
        <div className="border-border flex items-center justify-between gap-3 border-b bg-white/3 py-2 pr-2 pl-4">
          <span className="text-sm font-bold text-white/95">{title}</span>
          {renderCopyButton(`${email}\n${password}`, `${globalIndex}-both`, `Copy email and password of ${title}`, 'sm', 'Copy both')}
        </div>
        {row('Email', email, `${globalIndex}-email`, 'Copy email')}
        <div className="border-border border-t" />
        {row('Password', password, `${globalIndex}-password`, 'Copy password')}
      </div>
    )
  }

  const renderField = (label: string | null, value: string, id: string, title: string) => (
    <div className="flex flex-col gap-2">
      {label && <span className={ACCOUNT_SECTION_LABEL_CLASS}>{label}</span>}
      <div className="bg-background border-border flex h-13 items-center gap-3 rounded-[10px] border py-1.5 pr-1.5 pl-4">
        <span className="min-w-0 flex-1 truncate font-mono text-base font-medium tracking-[0.6px] text-white/95">
          {value}
        </span>
        {renderCopyButton(value, id, title)}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {currentKeys.map((key, index) => {
        const globalIndex = startIndex + index
        const credential = parseCredentialKey(key)

        if (credential) {
          return <div key={globalIndex}>{renderCredential(credential.email, credential.password, globalIndex)}</div>
        }

        // Plain key: only the first one carries the label.
        return (
          <div key={globalIndex}>
            {renderField(
              globalIndex === 0 ? (keys.length > 1 ? 'Product keys' : 'Product key') : null,
              key,
              `${globalIndex}-key`,
              'Copy key',
            )}
          </div>
        )
      })}

      {totalPages > 1 && (
        <div className="mt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  )
}
