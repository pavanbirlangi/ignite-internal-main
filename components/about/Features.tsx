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
  <Zap key="speed" className="h-5 w-5 text-white/95" />,
  <ShieldCheck key="trust" className="h-5 w-5 text-white/95" />,
  <CheckCircle2 key="clarity" className="h-5 w-5 text-white/95" />,
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
          <h2 data-display className="max-w-111.75 text-3xl font-bold text-white/95 capitalize">
            {title}
          </h2>
          <p className="text-white/65 max-w-148.25 text-base md:text-xl">
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
                <h3 className="text-xl font-bold text-white/95 md:text-2xl">
                  {feature.title}
                </h3>
              </div>

              <p className="text-white/65 text-base md:text-base">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
