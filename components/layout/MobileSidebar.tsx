'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import XIcon from '@/components/icons/XIcon'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NavItemType } from '@/lib/services/navbar.service'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  navItems?: NavItemType[]
}

export function MobileSidebar({ isOpen, onClose, navItems = [] }: MobileSidebarProps) {
  // Prevent scrolling on mount when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={cn(
          'bg-secondary fixed inset-y-0 left-0 z-101 flex w-[85vw] max-w-[400px] flex-col text-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 px-5">
          <Link
            href="/"
            onClick={onClose}
            className="flex shrink-0 items-center"
          >
            <Image
              src="/images/common/logo.svg"
              alt="Increddy Logo"
              width={100}
              height={16}
              className="h-4 w-auto object-contain"
            />
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="text-muted-foreground flex items-center justify-center rounded-full p-2 transition-colors hover:bg-white/10 hover:text-white"
          >
            <div className="h-5 w-5 [&>svg]:h-full [&>svg]:w-full">
              <XIcon />
            </div>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.to}
                onClick={onClose}
                className="text-muted-foreground flex items-center justify-between px-5 py-4 text-base font-medium transition-colors hover:bg-white/5 hover:text-white active:bg-white/10"
              >
                <span>{item.name}</span>
                <ChevronRight className="text-muted-foreground h-5 w-5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
