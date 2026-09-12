interface TransactionDetailsGridProps {
  orderId?: string
  orderAmount?: string
  transactionNumber?: string
  serviceFee?: string
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
      <p className="text-muted-foreground text-[10px] font-medium md:text-[12px]">
        {label}
      </p>
      <p
        className={`text-[14px] leading-tight wrap-break-word text-white ${
          emphasize ? 'font-semibold uppercase' : 'font-medium'
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
      label: 'Service Fee',
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
        <h3 className="text-[18px] font-semibold text-white md:text-[20px]">
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
