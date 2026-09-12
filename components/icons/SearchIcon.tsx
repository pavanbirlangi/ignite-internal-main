import { cn } from '@/lib/utils'

export default function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-6', className)}
    >
      <path
        d="M15.7953 15.8109L20.9998 20.9998M17.9998 10.4998C17.9998 14.6419 14.6419 17.9998 10.4998 17.9998C6.35768 17.9998 2.99982 14.6419 2.99982 10.4998C2.99982 6.35768 6.35768 2.99982 10.4998 2.99982C14.6419 2.99982 17.9998 6.35768 17.9998 10.4998Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
