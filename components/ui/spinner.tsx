import { cn } from '@/lib/utils'

interface SpinnerProps {
  className?: string
}

// A faint full ring with a bright arc that grows and shrinks as it turns,
// so the motion reads as smooth rather than a stiff rotating icon.
export function Spinner({ className }: SpinnerProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('animate-spinner-rotate size-6', className)}
    >
      <circle
        cx="12"
        cy="12"
        r="10.5"
        stroke="currentColor"
        strokeWidth="1.6"
        className="opacity-20"
      />
      <circle
        cx="12"
        cy="12"
        r="10.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="animate-spinner-dash"
      />
    </svg>
  )
}
