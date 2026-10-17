import { cn } from '@/lib/utils'

// Shared look for the account pages (profile, library, wishlist, orders, tickets), so every page
// uses the same panels, buttons, filters and badges.

export const ACCOUNT_CARD_CLASS = 'bg-card border-border rounded-xl border'

// Small caps heading inside a panel (PRODUCTS, SUMMARY).
export const ACCOUNT_SECTION_LABEL_CLASS =
  'text-xs leading-4 font-bold tracking-[1.2px] text-white/65 uppercase'

const ACTION_BASE =
  'inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0'

export const ACCOUNT_PRIMARY_BUTTON_CLASS = cn(
  ACTION_BASE,
  'bg-primary text-white hover:-translate-y-px hover:shadow-[0_10px_30px_-8px_var(--primary-glow-60)] hover:brightness-110',
)

export const ACCOUNT_SECONDARY_BUTTON_CLASS = cn(
  ACTION_BASE,
  'bg-secondary border-border border text-white/95 hover:border-white/20 hover:bg-white/10',
)

// Text-only action used in settings rows (Edit, Add, Change password).
export const ACCOUNT_TEXT_BUTTON_CLASS =
  'inline-flex h-8 cursor-pointer items-center rounded-md px-1 text-sm font-medium text-white/65 transition-colors outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-50'

export const ACCOUNT_SEARCH_INPUT_CLASS =
  'bg-background border-border h-11 w-full rounded-lg border pr-4 pl-10 text-sm text-white/95 transition-colors outline-none placeholder:text-white/45 hover:border-white/20 focus:border-primary/70'

export const ACCOUNT_INPUT_CLASS =
  'bg-background border-border h-11 w-full rounded-lg border px-3 text-sm text-white/95 transition-colors outline-none placeholder:text-white/45 hover:border-white/20 focus:border-primary/70'

export const ACCOUNT_SORT_TRIGGER_CLASS =
  'bg-secondary border-border flex h-11 cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm font-medium whitespace-nowrap text-white/95 transition-colors outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40'

export const ACCOUNT_MENU_PANEL_CLASS =
  'bg-card border-border absolute top-full right-0 z-20 mt-2 flex w-48 flex-col rounded-xl border p-1 shadow-xl'

export function accountMenuItemClass(active: boolean) {
  return cn(
    'flex h-10 w-full cursor-pointer items-center rounded-lg px-3 text-sm font-medium transition-colors hover:bg-white/5',
    active ? 'bg-white/5 text-white' : 'text-white/65 hover:text-white',
  )
}

export function accountChipClass(active: boolean) {
  return cn(
    'h-9 shrink-0 cursor-pointer rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/40',
    active ? 'bg-white text-background' : 'bg-secondary text-white/65 hover:bg-white/10 hover:text-white',
  )
}

export const ACCOUNT_CHIP_ROW_CLASS = 'scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 py-0.5'

export type StatusTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral'

const TONE_CLASS: Record<StatusTone, string> = {
  success: 'bg-[#22C55E]/12 text-[#4ADE80]',
  info: 'bg-primary/16 text-[#7DB0FF]',
  warning: 'bg-[#F5A524]/12 text-[#F5A524]',
  danger: 'bg-[#F04452]/14 text-[#FF6B76]',
  neutral: 'bg-white/8 text-white/65',
}

// Small rounded status label with a dot (order, ticket and email status).
export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: StatusTone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap',
        TONE_CLASS[tone],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

// Grey label over a white value, used in the order and ticket card headers.
export function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-white/65">{label}</span>
      <span className="text-sm font-medium text-white/95">{value}</span>
    </div>
  )
}

export function AccountPageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/65">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
