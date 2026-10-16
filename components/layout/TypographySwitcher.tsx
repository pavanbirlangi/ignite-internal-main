'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

// Preview toggle so the client can compare our current typography with an
// Epic Games Store style (Inter, Epic's sizes and weights). The styles live in
// globals.css under html[data-typography='epic'].
//
// Never shown on the live domain, so merging this can't expose it to
// customers. Remove once a typography is chosen.
const LIVE_HOSTS = ['increddy.com', 'www.increddy.com']
const STORAGE_KEY = 'typography-preview'

type Typography = 'current' | 'epic'

const OPTIONS: { value: Typography; label: string }[] = [
  { value: 'current', label: 'Current typography' },
  { value: 'epic', label: 'Epic typography (Inter)' },
]

const readStored = (): Typography => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'epic' ? 'epic' : 'current'
  } catch {
    // Storage can be blocked (private mode); fall back to the current style.
    return 'current'
  }
}

const subscribeNoop = () => () => {}

export default function TypographySwitcher() {
  // false during server render and hydration, true afterwards.
  const isClient = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )
  const visible = isClient && !LIVE_HOSTS.includes(window.location.hostname)
  // null until the visitor picks one, so the saved choice is used.
  const [picked, setPicked] = useState<Typography | null>(null)
  const typography = picked ?? (isClient ? readStored() : 'current')

  useEffect(() => {
    if (!visible) return
    document.documentElement.dataset.typography = typography
    try {
      localStorage.setItem(STORAGE_KEY, typography)
    } catch {}
  }, [typography, visible])

  if (!visible) return null

  return (
    <div
      role="radiogroup"
      aria-label="Typography preview"
      className="bg-secondary/95 fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 gap-1 rounded-full border border-white/15 p-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur md:bottom-5"
    >
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={typography === value}
          onClick={() => setPicked(value)}
          className={cn(
            'cursor-pointer rounded-full px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap text-white transition-colors',
            typography === value ? 'bg-primary' : 'hover:bg-white/10',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
