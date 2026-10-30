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

  const renderCopyButton = (value: string, id: string, title: string) => {
    const copied = copiedId === id
    return (
      <button
        type="button"
        onClick={() => handleCopy(value, id)}
        aria-label={title}
        className={cn(
          'inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/40',
          copied ? 'bg-[#22C55E]/12 text-[#4ADE80]' : 'bg-secondary text-white/95 hover:bg-white/10',
        )}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
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
          // Several logins: each pair is numbered (as in the keys PDF) and set apart by a line.
          const suffix = keys.length > 1 ? ` (${globalIndex + 1} of ${keys.length})` : ''
          return (
            <div
              key={globalIndex}
              className={cn('flex flex-col gap-3.5', index > 0 && 'border-border border-t pt-4')}
            >
              {renderField(`Email${suffix}`, credential.email, `${globalIndex}-email`, 'Copy email')}
              {renderField(`Password${suffix}`, credential.password, `${globalIndex}-password`, 'Copy password')}
            </div>
          )
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
