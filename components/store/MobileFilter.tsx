'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Filter, X } from 'lucide-react'
import FilterSidebar from './FilterSidebar'
import { cn } from '@/lib/utils'

const MobileFilter = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      // Small delay to allow render before transitioning opacity/transform
      const timer = setTimeout(() => setIsVisible(true), 10)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
      // Wait for transition to finish before unmounting
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Prevent scrolling when modal is open
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
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-secondary flex h-[40px] w-full cursor-pointer items-center justify-center gap-[8px] rounded-[8px] px-[16px] lg:hidden"
      >
        <Filter className="h-[16px] w-[16px] text-white" />
        <span className="text-[14px] font-bold text-white">
          Filters
        </span>
      </button>

      {/* Portal Overlay */}
      {mounted &&
        shouldRender &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex">
            {/* Backdrop */}
            <div
              className={cn(
                'absolute inset-0 cursor-pointer bg-black/60 transition-opacity duration-300 ease-in-out',
                isVisible ? 'opacity-100' : 'opacity-0',
              )}
              onClick={() => setIsOpen(false)}
            />

            {/* Sliding Sidebar */}
            <div
              className={cn(
                'relative flex h-full w-[85%] max-w-[320px] transform flex-col bg-[#1b1b1b] shadow-2xl transition-transform duration-300 ease-in-out',
                isVisible ? 'translate-x-0' : '-translate-x-full',
              )}
            >
              {/* Header */}
              <div className="border-secondary flex items-center justify-between border-b px-[20px] py-[16px]">
                <span className="text-[18px] font-bold text-white">
                  Filters
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="cursor-pointer rounded-full p-1 text-white transition-colors hover:bg-white/10"
                >
                  <X className="h-[24px] w-[24px]" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="mx-auto flex-1 overflow-y-auto w-full">
                <FilterSidebar className="w-full border-none! bg-transparent! p-0!" />
              </div>

              {/* Footer Actions */}
              {/* <div className="border-secondary bg-secondary border-t px-[20px] py-[16px]">
                <button
                  onClick={() => setIsOpen(false)}
                  className="bg-primary hover:bg-primary h-[44px] w-full cursor-pointer rounded-[8px] font-['Cooper_Hewitt'] font-bold text-white transition-colors"
                >
                  Show Results
                </button>
              </div> */}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

export default MobileFilter
