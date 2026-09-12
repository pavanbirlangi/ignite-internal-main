import { getProxyImageUrl } from '@/lib/utils'
import { Check, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type ConfirmationState = 'success-key-ready' | 'success-processing' | 'failed'

interface OrderConfirmationStatusProps {
  state?: ConfirmationState
  orderCode?: string
  itemSummary?: string
  productImage?: string
  actionHref?: string
}

const stateContent: Record<
  ConfirmationState,
  {
    title: string
    description: string
    buttonLabel: string
    buttonClassName: string
    iconWrapperClassName: string
    iconClassName: string
    showOrderCard: boolean
  }
> = {
  'success-key-ready': {
    title: 'Order Confirmed',
    description:
      'Your purchase was successful. Your activation key is now available below. Please reveal it to view for usage.',
    buttonLabel: 'View Keys',
    buttonClassName:
      'border-muted-foreground bg-transparent hover:bg-white/5 text-white',
    iconWrapperClassName: 'bg-[#0B5028]/70',
    iconClassName: 'bg-[#00C950] text-[#05331A]',
    showOrderCard: true,
  },
  'success-processing': {
    title: 'Order Confirmed',
    description:
      'Your payment has been successfully processed. Your activation key will be available shortly.',
    buttonLabel: 'Order History',
    buttonClassName:
      'border-muted-foreground bg-transparent hover:bg-white/5 text-white',
    iconWrapperClassName: 'bg-[#0B5028]/70',
    iconClassName: 'bg-[#00C950] text-[#05331A]',
    showOrderCard: true,
  },
  failed: {
    title: 'Order Failed',
    description:
      "Your order could not be completed. If any amount was deducted, it will be refunded according to your payment provider's timelines.",
    buttonLabel: 'Contact Support',
    buttonClassName:
      'bg-[#3169D0] hover:bg-[#2758BA] text-white border-transparent',
    iconWrapperClassName: 'bg-[#5A111C]/70',
    iconClassName: 'bg-[#E7000B] text-[#4D0003]',
    showOrderCard: false,
  },
}

export default function OrderConfirmationStatus({
  state = 'success-key-ready',
  orderCode = '#ZRSYPNNQ',
  itemSummary = '(2x) Call Of Duty Black OPS 2 | (2x) Read Dead Redemption | Dispatch',
  productImage = '/images/404.png',
  actionHref,
}: OrderConfirmationStatusProps) {
  const content = stateContent[state]
  const href =
    actionHref ||
    (state === 'failed'
      ? '/help'
      : state === 'success-key-ready'
        ? '/dashboard/my-library'
        : '/dashboard/my-orders')

  return (
    <section className="border-secondary bg-secondary/20 w-full rounded-3xl border px-4 py-6 backdrop-blur-[50px] sm:px-5 sm:py-8 md:rounded-[40px] md:px-10 md:py-10">
      <div className="mx-auto flex max-w-230 flex-col items-center text-center">
        <div
          className={`mb-6 flex size-16 items-center justify-center rounded-full ${content.iconWrapperClassName}`}
        >
          <div
            className={`flex size-10 items-center justify-center rounded-full ${content.iconClassName}`}
          >
            {state === 'failed' ? (
              <X className="size-8" strokeWidth={3} />
            ) : (
              <Check className="size-8" strokeWidth={3} />
            )}
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-white md:text-[28px]">
          {content.title}
        </h1>
        <p className="text-muted-foreground mt-5 max-w-126 text-xs leading-[1.2] font-medium md:text-[14px]">
          {content.description}
        </p>

        {content.showOrderCard ? (
          <div className="glassmorphism mt-10 flex h-auto w-full max-w-2xl flex-col items-start gap-2.5 rounded-[20px] border border-white/10 bg-[rgba(43,43,43,0.2)] px-4 py-3 sm:px-5 sm:py-3 md:h-25.75">
            <div className="flex h-auto w-full flex-col gap-4 md:h-19.75 md:flex-row md:items-start md:justify-between md:gap-6">
              <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-5 md:max-w-117">
                <div className="relative h-19.75 w-15.5 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={getProxyImageUrl(productImage)}
                    alt="Purchased product"
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col items-start gap-2 text-left md:w-96.5">
                  <h2 className="text-semibold max-h-14 w-full truncate text-base leading-6 text-white sm:text-[18px] sm:leading-7">
                    {orderCode}
                  </h2>
                  <p className="text-muted-foreground line-clamp-2 w-full text-[12px] leading-4 font-[705]">
                    {itemSummary}
                  </p>
                </div>
              </div>

              <div className="flex w-full items-end justify-end md:h-19.75 md:w-28">
                <Link
                  href={href}
                  className={`flex h-10 w-full items-center justify-center rounded-[6px] border px-3 text-[14px] leading-4.5 font-semibold transition-colors md:w-28 ${content.buttonClassName}`}
                >
                  {content.buttonLabel}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <Link
            href={href}
            className={`mt-10 flex h-10 w-full items-center justify-center rounded-[6px] border px-6 text-sm font-semibold transition-colors sm:text-base md:w-auto md:min-w-28 md:text-[14px] ${content.buttonClassName}`}
          >
            {content.buttonLabel}
          </Link>
        )}
      </div>
    </section>
  )
}
