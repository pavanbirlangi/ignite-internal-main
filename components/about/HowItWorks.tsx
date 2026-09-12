interface HowItWorksBlock {
  title: string
  subtitle: string
  description: string
}

interface HowItWorksProps {
  title?: string
  blocks?: HowItWorksBlock[]
}

export default function HowItWorks({
  title = 'How It Works?',
  blocks,
}: HowItWorksProps) {
  const fallbackSteps = [
    {
      title: 'Discover',
      subtitle: 'Discover what you need',
      description:
        "Browse a wide selection of games, software, gift cards, and subscriptions across platforms and categories. Use search, genres, and curated sections to quickly find exactly what you're looking for — without unnecessary filters or clutter.",
    },
    {
      title: 'Purchase',
      subtitle: 'Purchase with confidence',
      description:
        'Every product page clearly shows pricing, platform compatibility, region details, and activation information before you checkout. Complete your purchase securely with trusted payment methods and full price transparency.',
    },
    {
      title: 'Instant Access',
      subtitle: 'Get instant access',
      description:
        "Once your payment is confirmed, your digital key or code is delivered instantly. There's no waiting, shipping, or manual processing — your purchase is available immediately in your account or email.",
    },
    {
      title: 'Activate & Enjoy',
      subtitle: 'Activate and start using',
      description:
        'Follow simple, step-by-step activation instructions to redeem your game, software, or subscription. If you ever need help, our support team and guides are available to ensure a smooth experience from start to finish.',
    },
  ]

  const steps = blocks?.length ? blocks : fallbackSteps

  return (
    <section className="bg-background relative z-10 w-full py-16 md:py-24 lg:py-32">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-10 flex flex-col items-center justify-center text-center md:mb-14">
          <h2 className="text-2xl leading-none font-semibold text-white capitalize md:text-[40px]">
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {steps.map((step, index) => (
            <div
              key={`${step.title}-${index}`}
              className="bg-secondary/20 hover:bg-secondary/30 flex flex-col gap-4 rounded-[20px] border border-white/5 px-5 pb-5 pt-6 transition-colors"
            >
              <div className="flex flex-col">
                <h3 className="mb-1 text-[20px] font-semibold text-white md:text-[24px]">
                  {index + 1}. {step.title}
                </h3>
                <span className="text-primary text-[14px] font-semibold md:text-[16px]">
                  {step.subtitle}
                </span>
              </div>
              <p className="text-muted-foreground text-[15px] leading-[1.4]  md:text-[16px] md:leading-5">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
