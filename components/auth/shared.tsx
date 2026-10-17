import React from 'react'
import { cn } from '@/lib/utils'

// Shared look for every sign-in screen (login, register, recover, email code):
// black bordered fields with small caps labels, like the checkout and the
// currency picker. Submit buttons use <Button variant="primary"> with
// SUBMIT_CLASS so hover and loading match the rest of the site.
export const INPUT_CLASS =
  'bg-background border-border h-11 rounded-lg border px-3.5 text-sm! font-medium! text-white/95 shadow-none backdrop-blur-none placeholder:text-white/45 transition-colors hover:border-white/20 focus-visible:border-primary/70 focus-visible:ring-0'

export const SUBMIT_CLASS = 'h-11 w-full rounded-lg text-sm md:text-sm'

export const LINK_CLASS =
  'cursor-pointer text-sm text-white/65 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-white/65'

export const PASSWORD_TOGGLE_CLASS =
  'absolute top-1/2 right-3 flex -translate-y-1/2 cursor-pointer items-center justify-center p-1 text-white/65 transition-colors hover:text-white'

export function Field({
  label,
  error,
  className,
  children,
}: {
  label: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-2 block text-xs font-bold tracking-[1.2px] text-white/65 uppercase">
        {label}
      </span>
      {children}
      {error && <span className="text-red mt-1.5 block text-xs">{error}</span>}
    </label>
  )
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="bg-border h-px flex-1" />
      <span className="text-xs font-bold tracking-[1.2px] text-white/45">OR</span>
      <span className="bg-border h-px flex-1" />
    </div>
  )
}

// The line under a form, e.g. "New here? Create an account".
export function AuthFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border mt-5 border-t pt-5 text-center text-sm text-white/65">
      {children}
    </div>
  )
}

export const FOOTER_ACTION_CLASS =
  'cursor-pointer font-medium text-white/95 transition-colors hover:text-white hover:underline focus-visible:underline focus-visible:outline-none'
