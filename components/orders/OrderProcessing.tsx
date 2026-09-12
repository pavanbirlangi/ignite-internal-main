import { CheckCircle2, Clock, Loader2 } from 'lucide-react'

const OrderProcessing = () => {
  const stepsData = [
    {
      id: 1,
      icon: CheckCircle2,
      iconColor: 'text-primary',
      title: 'Reserving Keys',
      description: 'Finalizing your purchase and securing the keys.',
    },
    {
      id: 2,
      icon: Loader2,
      iconColor: 'text-primary animate-spin',
      title: 'Confirming Payment',
      description:
        'Waiting for bank confirmation. this might take few minutes.',
    },
    {
      id: 3,
      icon: Clock,
      iconColor: 'text-accent',
      title: 'Fetching Your Keys',
      description: 'Your keys will be available in “My Library” section',
    },
  ]
  return (
    <>
      <div className="px-4 text-center sm:px-0">
        <h1 className="text-2xl font-semibold text-white md:text-3xl">
          Processing Your Order
        </h1>
        <p className="text-muted-foreground mt-2 max-w-74 text-center text-sm font-medium md:mt-5">
          We’re preparing your order. Please wait while we confirm your payment.
        </p>
      </div>
      <div className="bg-secondary/40 glassmorphism flex h-auto w-full max-w-209 flex-col gap-8 rounded-[20px] p-4 md:h-50.25 md:flex-row md:gap-24 md:p-10">
        {stepsData.map((step) => {
          const Icon = step.icon
          return (
            <div
              key={step.id}
              className="flex w-full flex-col items-center justify-center-safe gap-4"
            >
              <div className="relative flex items-center justify-center">
                <div className="bg-secondary flex size-12 items-center justify-center rounded-xl p-2">
                  <Icon className={`size-7 ${step.iconColor}`} />
                </div>

                {step.id !== stepsData.length && (
                  <span className="absolute top-1/2 left-full hidden w-18 translate-x-1/4 -translate-y-1/2 border-t border-dashed border-white/80 md:block md:w-37.5" />
                )}
              </div>
              <div>
                <h2 className="text-center text-lg font-medium text-white md:text-[20px]">
                  {step.title}
                </h2>
                <p className="text-muted-foreground mt-1 w-full max-w-47 text-center text-xs">
                  {step.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

export default OrderProcessing
