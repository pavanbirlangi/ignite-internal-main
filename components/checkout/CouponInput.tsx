'use client'

import { useState } from 'react'
import { Tag, X, Loader2, ChevronDown } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { extractApiErrorMessage } from '@/lib/utils/api-error'

interface CouponInputProps {
  // Called after a successful apply/remove -- the checkout page uses this to force a fresh
  // Stripe payment session, since the cart total just changed and a session already exists.
  onCartChanged: () => void
}

export function CouponInput({ onCartChanged }: CouponInputProps) {
  const appliedCode = useCartStore((state) => state.cart?.promoCodes[0] ?? null)
  const applyPromoCode = useCartStore((state) => state.applyPromoCode)
  const removePromoCode = useCartStore((state) => state.removePromoCode)
  const [expanded, setExpanded] = useState(false)
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApply = async () => {
    const trimmed = code.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)
    try {
      await applyPromoCode(trimmed)
      setCode('')
      setExpanded(false)
      onCartChanged()
    } catch (err) {
      setError(extractApiErrorMessage(err, 'This code is not valid.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCollapse = () => {
    setExpanded(false)
    setCode('')
    setError(null)
  }

  const handleRemove = async () => {
    if (!appliedCode) return
    setSubmitting(true)
    try {
      await removePromoCode(appliedCode)
      onCartChanged()
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Could not remove this code.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (appliedCode) {
    return (
      <div className="bg-secondary/40 flex items-center justify-between rounded-md px-3 py-2.5">
        <span className="flex items-center gap-2 text-sm font-medium text-white">
          <Tag className="text-primary size-3.5" />
          {appliedCode}
        </span>
        <button
          type="button"
          onClick={handleRemove}
          disabled={submitting}
          aria-label="Remove coupon code"
          className="text-muted-foreground hover:text-white disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <X className="size-4" />
          )}
        </button>
      </div>
    )
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-primary flex items-center gap-1.5 text-sm font-semibold"
      >
        <Tag className="size-3.5" />
        Have a coupon?
        <ChevronDown className="size-3.5" />
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-background/40 focus-within:border-primary/60 flex items-center gap-2 rounded-md border border-white/10 px-3 py-2.5 transition-colors">
        <Tag className="text-muted-foreground size-3.5 shrink-0" />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleApply()
            }
          }}
          placeholder="Enter coupon code"
          className="placeholder:text-muted-foreground w-full min-w-0 bg-transparent text-sm font-medium text-white outline-none"
          disabled={submitting}
          autoFocus
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={submitting || !code.trim()}
          className="text-primary shrink-0 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : 'Apply'}
        </button>
        <button
          type="button"
          onClick={handleCollapse}
          disabled={submitting}
          aria-label="Cancel"
          className="text-muted-foreground hover:text-white shrink-0 disabled:opacity-50"
        >
          <X className="size-3.5" />
        </button>
      </div>
      {error && <p className="text-red text-xs font-medium">{error}</p>}
    </div>
  )
}
