interface TransactionDetailsGridProps {
  orderId?: string
  orderAmount?: string
  transactionNumber?: string
  serviceFee?: string
  serviceFeeLabel?: string
  paymentMode?: string
  savingDiscount?: string
}

interface DetailItemProps {
  label: string
  value: string
  emphasize?: boolean
}

function DetailItem({ label, value, emphasize = false }: DetailItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-white/65 text-xs font-medium md:text-xs">
        {label}
      </p>
      <p
        className={`text-sm leading-tight wrap-break-word text-white/95 ${
          emphasize ? 'font-bold uppercase' : 'font-medium'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

export function TransactionDetailsGrid({
  orderId = '-',
  orderAmount = '-',
  transactionNumber = '-',
  serviceFee = '-',
  serviceFeeLabel = 'Service Fee',
  paymentMode = '-',
  savingDiscount = '-',
}: TransactionDetailsGridProps) {
  const details = [
    {
      label: 'Order ID',
      value: orderId,
      emphasize: true,
    },
    {
      label: 'Order Amount',
      value: orderAmount,
    },
    {
      label: 'Transaction Number',
      value: transactionNumber,
    },
    {
      label: serviceFeeLabel,
      value: serviceFee,
    },
    {
      label: 'Payment Mode',
      value: paymentMode,
    },
    {
      label: 'Saving/Discount',
      value: savingDiscount,
    },
  ]

  return (
    <section className="mt-8 w-full">
      <div className="border-secondary bg-secondary/20 rounded-xl border px-4 py-6 backdrop-blur-[50px] sm:px-5 md:px-10 md:py-8">
        <h3 className="text-xl font-bold text-white/95 md:text-xl">
          Transaction Details
        </h3>

        <div className="border-secondary mt-4 border-b" />

        <div className="mt-6 grid w-full grid-cols-1 gap-y-8 sm:gap-y-10 md:grid-cols-2 lg:w-1/2">
          {details.map((item) => (
            <DetailItem
              key={item.label}
              label={item.label}
              value={item.value}
              emphasize={item.emphasize}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
