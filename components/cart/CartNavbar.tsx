'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { UserMenu } from '../layout/navbar/UserMenu'
import { CartDrawer } from './CartDrawer'
import { Check } from 'lucide-react'
import { useSiteLogo } from '@/components/providers/SiteLogoProvider'

interface CartNavbarProps {
  currentStep?: number
  itemCount?: number
}

export function CartNavbar({
  currentStep = 1,
  itemCount = 0,
}: CartNavbarProps) {
  const logoSrc = useSiteLogo()
  const steps = [
    { number: 1, label: 'Cart' },
    { number: 2, label: 'Checkout' },
    { number: 3, label: 'Redeem' },
  ]

  return (
    <nav className="bg-background border-muted-foreground sticky top-0 right-0 left-0 z-50 flex h-32 flex-col items-center justify-center border-b backdrop-blur-md md:h-28">
      <div className="absolute top-4 flex w-full max-w-310 items-center justify-between px-4 lg:top-10">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src={logoSrc}
            alt="Logo"
            width={100}
            height={100}
            className="h-4 w-auto sm:h-5"
            // Same as the main header: the Directus PNG resized to WebP, at the top so not lazy.
            sizes="(max-width: 640px) 150px, 210px"
            loading="eager"
          />
        </Link>

        <div className="flex items-center gap-3 text-white/95 sm:gap-5">
          <UserMenu />

          <div className="text-white/65 transition-colors hover:text-white">
            <CartDrawer />
          </div>
        </div>
      </div>

      <div className="absolute top-16 left-1/2 mt-2 flex -translate-x-1/2 items-center gap-2 lg:top-10">
        {steps.map((step, index) => {
          const isActive = step.number === currentStep
          const isCompleted = step.number < currentStep
          const isNext = index < steps.length - 1

          return (
            <div key={step.number} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 rounded-md transition-colors`}
              >
                <span
                  className={`flex size-9 items-center justify-center rounded-[6px] px-2 py-1 text-xs font-bold sm:px-3 sm:py-2.5 sm:text-base ${isActive ? 'bg-primary text-white/95' : isCompleted ? 'bg-[#22C55E]/16 text-[#4ADE80]' : 'text-white/65 bg-secondary'}`}
                >
                  {isCompleted ? <Check className="size-4" strokeWidth={3} aria-label="Done" /> : step.number}
                </span>
                <span
                  className={`text-xs sm:text-base ${isActive ? 'font-bold text-white/95' : isCompleted ? 'font-medium text-white/95' : 'text-white/65 font-medium'}`}
                >
                  {step.label}
                </span>
              </div>

              {isNext && (
                <div
                  className={`hidden h-px w-10 sm:block sm:w-40 ${
                    isCompleted ? 'bg-[#22C55E]/50' : 'bg-border'
                  }`}
                />
              )}
              {isNext && (
                <div
                  className={`block h-px w-4 sm:hidden ${
                    isCompleted ? 'bg-[#22C55E]/50' : 'bg-border'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
