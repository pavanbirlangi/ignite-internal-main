'use client'

import * as React from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination'
import CopyIcon from '@/components/icons/CopyIcon'

interface KeyListProps {
  keys: string[]
}

/**
 * Parses a key string that may contain credential tags.
 * Format: "<email>name@mail.com<password>xyz"
 * Returns parsed credential fields or null if not in credential format.
 */
function parseCredentialKey(
  key: string,
): { email: string; password: string } | null {
  const emailTagStart = key.indexOf('<email>')
  const passwordTagStart = key.indexOf('<password>')

  if (emailTagStart === -1 || passwordTagStart === -1) return null

  const email = key
    .substring(emailTagStart + '<email>'.length, passwordTagStart)
    .trim()
  const password = key.substring(passwordTagStart + '<password>'.length).trim()

  if (!email && !password) return null

  return { email, password }
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

  const renderCopyButton = (value: string, id: string, title: string) => (
    <button
      onClick={() => handleCopy(value, id)}
      className="text-muted-foreground hover:bg-secondaryborder-secondary rounded-md p-2 transition-colors hover:text-white"
      title={title}
    >
      {copiedId === id ? (
        <Check className="text-destructive size-6" />
      ) : (
        <CopyIcon />
      )}
    </button>
  )

  return (
    <div className="flex flex-col gap-4">
      {currentKeys.map((key, index) => {
        const globalIndex = startIndex + index
        const credential = parseCredentialKey(key)

        if (credential) {
          return (
            <div key={globalIndex} className="flex flex-col gap-3">
              {/* Email field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-white">
                  Email
                </label>
                <div className="bg-secondary hover:border-secondary group flex h-12 items-center justify-between rounded-xl border border-transparent p-4 px-5 transition-colors md:h-13.5">
                  <span className="mr-4 truncate font-mono text-lg font-semibold tracking-wider text-white">
                    {credential.email}
                  </span>
                  {renderCopyButton(
                    credential.email,
                    `${globalIndex}-email`,
                    'Copy email',
                  )}
                </div>
              </div>

              {/* Password field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-white">
                  Password
                </label>
                <div className="bg-secondary hover:border-secondary group flex h-12 items-center justify-between rounded-xl border border-transparent p-4 px-5 transition-colors md:h-13.5">
                  <span className="mr-4 truncate font-mono text-lg font-semibold tracking-wider text-white">
                    {credential.password}
                  </span>
                  {renderCopyButton(
                    credential.password,
                    `${globalIndex}-password`,
                    'Copy password',
                  )}
                </div>
              </div>
            </div>
          )
        }

        // Default: plain key display
        return (
          <div
            key={globalIndex}
            className="bg-secondary hover:border-secondary group flex h-12 items-center justify-between rounded-xl border border-transparent p-4 px-5 transition-colors md:h-13.5"
          >
            <span className="mr-4 truncate font-mono text-lg font-semibold tracking-wider text-white">
              {key}
            </span>
            {renderCopyButton(key, `${globalIndex}-key`, 'Copy key')}
          </div>
        )
      })}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination>
            <PaginationContent className="items-center gap-2">
              <PaginationItem>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) setCurrentPage((p) => p - 1)
                  }}
                  disabled={currentPage === 1}
                  className={cn(
                    'text-muted-foreground flex h-10 w-10 items-center justify-center rounded-[6px] transition-colors',
                    currentPage === 1
                      ? 'cursor-not-allowed'
                      : 'hover:bg-secondaryborder-secondary hover:text-white',
                  )}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </PaginationItem>

              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage(i + 1)
                    }}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-[6px] text-sm font-semibold transition-colors',
                      currentPage === i + 1
                        ? 'bg-background border-primary text-foreground border-2'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary hover:text-white',
                    )}
                  >
                    {i + 1}
                  </button>
                </PaginationItem>
              ))}

              <PaginationItem>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages) setCurrentPage((p) => p + 1)
                  }}
                  disabled={currentPage === totalPages}
                  className={cn(
                    'text-muted-foreground flex h-10 w-10 items-center justify-center rounded-[6px] transition-colors',
                    currentPage === totalPages
                      ? 'cursor-not-allowed'
                      : 'hover:bg-secondaryborder-secondary hover:text-white',
                  )}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
