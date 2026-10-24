'use client'

import * as React from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ACCOUNT_CARD_CLASS, ACCOUNT_SECTION_LABEL_CLASS } from '@/components/library/account-ui'

interface TransactionItemProps {
  label: string
  value: string
  isTotal?: boolean
}

interface TransactionDetailsProps {
  // Stripe's payment reference ("pi_..."), what support looks the payment up by. Hidden when absent.
  paymentReference?: string
  paymentMode?: string
  subtotal?: string
  // Optional rows: each is shown only when passed (i.e. when it applies to the order).
  discount?: string
  serviceFee?: string
  serviceFeeLabel?: string
  tax?: string
  refunded?: string
  // With a refund, "total" is shown as "Total paid" and this as the final "Net paid" row.
  netPaid?: string
  // A local method charged in its own currency (e.g. Bancontact in EUR): what was actually charged.
  charged?: { currency: string; amount: string }
  total: string
  // Buttons shown under the total (download keys / receipt).
  actions?: React.ReactNode
  className?: string
}

function TransactionItem({
  label,
  value,
  isTotal = false,
}: TransactionItemProps) {
  if (isTotal) {
    return (
      <div className="border-border mt-2 flex items-center justify-between border-t pt-4 pb-1">
        <span className="text-base font-bold text-white/95">{label}</span>
        <span className="text-xl font-bold text-white/95">{value}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-white/65">{label}</span>
      <span className="text-right text-sm font-medium text-white/95">{value}</span>
    </div>
  )
}

// The reference is long ("pi_" + 24 characters), so it's cut to the row and copied whole.
function PaymentReferenceItem({ reference }: { reference: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(reference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="shrink-0 text-sm text-white/65">Payment reference</span>
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-sm font-medium text-white/95" title={reference}>
          {reference}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Payment reference copied' : 'Copy payment reference'}
          title={copied ? 'Copied' : 'Copy'}
          className={cn(
            'inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/40',
            copied ? 'text-[#4ADE80]' : 'text-white/65 hover:bg-white/10 hover:text-white/95',
          )}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </span>
    </div>
  )
}

// Receipt-style order summary: grey labels, white values, the total in bold.
export function TransactionDetails({
  paymentReference,
  paymentMode = '-',
  subtotal = '-',
  discount,
  serviceFee,
  serviceFeeLabel = 'Service Fee',
  tax,
  refunded,
  netPaid,
  charged,
  total,
  actions,
  className,
}: TransactionDetailsProps) {
  return (
    <div className={cn(ACCOUNT_CARD_CLASS, 'p-5', className)}>
      <h2 data-display className={cn(ACCOUNT_SECTION_LABEL_CLASS, 'mb-2')}>Summary</h2>
      <div className="flex flex-col">
        {paymentReference && <PaymentReferenceItem reference={paymentReference} />}
        <TransactionItem label="Payment Method" value={paymentMode} />
        <TransactionItem label="Subtotal" value={subtotal} />
        {discount && <TransactionItem label="Discount" value={discount} />}
        {serviceFee && <TransactionItem label={serviceFeeLabel} value={serviceFee} />}
        {tax && <TransactionItem label="Tax" value={tax} />}
        {charged && (
          <TransactionItem label={`Charged in ${charged.currency}`} value={charged.amount} />
        )}
        {refunded ? (
          <>
            <TransactionItem label="Total paid" value={total} />
            <TransactionItem label="Refunded" value={refunded} />
            <TransactionItem label="Net paid" value={netPaid ?? total} isTotal />
          </>
        ) : (
          <TransactionItem label="Total" value={total} isTotal />
        )}
      </div>
      {actions && <div className="mt-4 flex flex-col gap-2">{actions}</div>}
    </div>
  )
}
