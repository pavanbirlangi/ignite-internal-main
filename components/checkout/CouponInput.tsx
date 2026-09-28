'use client'

import { useState } from 'react'
import { Tag, X, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
      <div className="flex gap-2">
        <Input
          size="sm"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleApply()
            }
          }}
          placeholder="Enter code"
          className="flex-1 text-sm"
          disabled={submitting}
          autoFocus
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleApply}
          disabled={submitting || !code.trim()}
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : 'Apply'}
        </Button>
      </div>
      {error && <p className="text-red text-xs font-medium">{error}</p>}
    </div>
  )
}
