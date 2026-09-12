import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const inputVariants = cva(
  [
    'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground w-full min-w-0 rounded-md border border-muted-foreground bg-background/60 backdrop-blur-2xl px-3 py-1 text-lg font-medium shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-lg file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-lg',
    'focus-visible:ring-ring focus-visible:ring-2',
    'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  ],
  {
    variants: {
      size: {
        xs: 'h-6',
        sm: 'h-8',
        md: 'h-12',
        lg: 'h-14 px-5 py-4 rounded-full',
        xl: 'h-16 px-5 py-5 rounded-full',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

function Input({
  className,
  type,
  size,
  ...props
}: Omit<React.ComponentProps<'input'>, 'size'> &
  VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ size, className }))}
      {...props}
    />
  )
}

export { Input, inputVariants }
