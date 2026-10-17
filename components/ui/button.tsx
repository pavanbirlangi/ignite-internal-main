import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap rounded-md text-base md:text-xl font-bold transition-all duration-200 ease-out motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-7 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring focus-visible:ring-4 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive select-none",
  {
    variants: {
      variant: {
        // Soft blue glow and a slight lift on hover, no hard ring -- the same hover language as
        // the header's capsule and icon buttons, rather than a stark white outline.
        primary: [
          'bg-primary text-primary-foreground',
          'hover:shadow-[0_10px_30px_-8px_var(--primary-glow-60)] hover:brightness-110 hover:-translate-y-px',
          'active:shadow-none active:brightness-95 active:translate-y-0',
        ],
        secondary: [
          'bg-secondary text-secondary-foreground',
          'hover:bg-foreground/15',
        ],
        outline: [
          'bg-transparent text-primary ring-primary ring-2 ring-inset',
          'hover:shadow-[0_10px_30px_-8px_var(--primary-glow-60)] hover:bg-primary/10',
          'active:shadow-none active:bg-primary/15',
        ],
        ghost: 'hover:bg-primary hover:text-primary-foreground',
        destructive:
          'bg-destructive text-white/95 hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        md: 'h-12 min-w-12 px-4 py-2 rounded-md',
        lg: 'h-14 min-w-14 rounded-md px-6',
        xl: 'h-16 min-w-16 rounded-full px-8',

        // @deprecated Use icon={true} instead
        icon: 'size-9',
        'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
      icon: {
        true: 'px-0',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Shows the same spinner ring as the product cards in place of the label
   *  (kept invisible so the button keeps its size) and disables the button. */
  loading?: boolean
}

function Button({
  className,
  variant,
  size,
  icon,
  asChild,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(
        buttonVariants({ variant, size, icon, className }),
        loading && 'relative disabled:opacity-100',
      )}
      {...props}
    >
      {loading && !asChild ? (
        <>
          <span className="invisible contents">{children}</span>
          <span className="absolute inset-0 grid place-items-center">
            <Spinner className="size-5" />
          </span>
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
