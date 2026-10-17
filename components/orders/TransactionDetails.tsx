'use client'

interface TransactionItemProps {
  label: string
  value: string
  isTotal?: boolean
}

interface TransactionDetailsProps {
  transactionNumber?: string
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
}

function TransactionItem({
  label,
  value,
  isTotal = false,
}: TransactionItemProps) {
  return (
    <div
      className={`flex items-center font-bold justify-between py-4 ${!isTotal ? 'border-secondary border-b' : 'pt-6'}`}
    >
      <span
        className={`text-sm font-bold ${isTotal ? 'text-white/65 font-bold' : 'text-white/65'}`}
      >
        {label}
      </span>
      <span
        className={`text-sm font-bold ${isTotal ? 'font-bold text-white/95' : 'font-bold text-white/95'}`}
      >
        {value}
      </span>
    </div>
  )
}

export function TransactionDetails({
  transactionNumber = '-',
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
}: TransactionDetailsProps) {
  return (
    <div className="mt-8 flex w-full flex-col gap-3">
      <h3 className="text-xl font-bold text-white/95 md:text-xl">
        Transaction Details
      </h3>
      <div className="border-secondary bg-secondary/20 rounded-xl border py-4 px-5 backdrop-blur-[50px]">
        <div className="flex flex-col">
          <TransactionItem
            label="Transaction Number"
            value={transactionNumber}
          />
          <TransactionItem label="Payment Mode" value={paymentMode} />
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
      </div>
    </div>
  )
}
