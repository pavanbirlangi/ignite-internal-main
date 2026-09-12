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
  tax?: string
  refunded?: string
  total: string
}

function TransactionItem({
  label,
  value,
  isTotal = false,
}: TransactionItemProps) {
  return (
    <div
      className={`flex items-center font-semibold justify-between py-4 ${!isTotal ? 'border-secondary border-b' : 'pt-6'}`}
    >
      <span
        className={`text-[14px] font-semibold ${isTotal ? 'text-muted-foreground font-semibold' : 'text-muted-foreground'}`}
      >
        {label}
      </span>
      <span
        className={`text-[14px] font-semibold ${isTotal ? 'font-bold text-white' : 'font-semibold text-white'}`}
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
  tax = '-',
  refunded = '-',
  total,
}: TransactionDetailsProps) {
  return (
    <div className="mt-8 flex w-full flex-col gap-3">
      <h3 className="text-[18px] font-semibold text-white md:text-[20px]">
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
          <TransactionItem label="Tax" value={tax} />
          <TransactionItem label="Refunded" value={refunded} />
          <TransactionItem label="Total" value={total} isTotal />
        </div>
      </div>
    </div>
  )
}
