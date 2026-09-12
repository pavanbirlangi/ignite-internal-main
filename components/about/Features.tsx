'use client'

import { Zap, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { ReactNode } from 'react'

interface FeatureBlock {
  title: string
  icon?: string
  description: string
}

interface FeaturesProps {
  title?: string
  description?: string
  blocks?: FeatureBlock[]
}

const defaultIcons: ReactNode[] = [
  <Zap key="speed" className="h-5 w-5 text-white" />,
  <ShieldCheck key="trust" className="h-5 w-5 text-white" />,
  <CheckCircle2 key="clarity" className="h-5 w-5 text-white" />,
]

export default function Features({
  title = 'Built For Instant Access To Digital Experiences.',
  description = 'Increddy is a modern marketplace for games, software, gift cards, and subscriptions — designed around speed, security, and clarity.',
  blocks,
}: FeaturesProps) {
  const fallbackFeatures: FeatureBlock[] = [
    {
      title: 'Speed',
      description:
        'Digital keys and codes are delivered immediately after checkout — no delays, no waiting.',
    },
    {
      title: 'Trust',
      description:
        'Every product on Increddy is sourced from verified distributors and delivered securely.',
    },
    {
      title: 'Clarity',
      description:
        'Clear pricing, platform compatibility, and region details — before you buy.',
    },
  ]

  const features = blocks?.length ? blocks : fallbackFeatures

  return (
    <section className="bg-background relative z-10 w-full pb-16 md:pb-24 lg:pb-32">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header content matching Figma */}
        <div className="mb-10 flex flex-col items-center gap-4 text-center md:mb-14 md:items-start md:text-left">
          <h2 className="max-w-111.75 text-2xl leading-12.25 font-semibold text-white capitalize md:text-[40px]">
            {title}
          </h2>
          <p className="text-muted-foreground max-w-148.25 text-base leading-[1.4] md:text-[18px]">
            {description}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={`${feature.title}-${index}`}
              className="bg-secondary/20 hover:bg-secondary/30 flex flex-col gap-6 rounded-[20px] border border-white/5 px-5 py-4 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="bg-primary flex size-10 items-center justify-center rounded-full">
                  {feature.icon ? (
                    <div
                      className="h-6 w-6 [&_svg]:h-6 [&_svg]:w-6"
                      dangerouslySetInnerHTML={{ __html: feature.icon }}
                    />
                  ) : (
                    (defaultIcons[index] ?? defaultIcons[0])
                  )}
                </div>
                <h3 className="text-[20px] font-semibold text-white md:text-[24px]">
                  {feature.title}
                </h3>
              </div>

              <p className="text-muted-foreground text-[15px] leading-[1.4] md:text-[16px] md:leading-5">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
