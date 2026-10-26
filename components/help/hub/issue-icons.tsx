import { CircleHelp, CreditCard, Gamepad2, MessageCircle, PackageCheck, type LucideIcon } from 'lucide-react'

// The Help Centre's issue types by Directus slug, in the site's line icons and blue (the
// Directus icons are orange images). An unknown slug gets a question mark.
const ICONS: Record<string, LucideIcon> = {
  'product-activation': Gamepad2,
  'product-delivery': PackageCheck,
  payments: CreditCard,
  other: MessageCircle,
}

export function IssueIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? CircleHelp
  return <Icon className={className} aria-hidden />
}
