import { ArrowUpRight, Briefcase, Mail, Scale, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface ContactCardProps {
  title: string
  description: string
  email: string
  index?: number
}

const ICONS: LucideIcon[] = [Briefcase, Scale, Users]

// Icon by team name, falling back by position for teams added later in Directus.
function TeamIcon({ title, index }: { title: string; index: number }) {
  const name = title.toLowerCase()
  const icon = name.includes('legal')
    ? 1
    : name.includes('talent') || name.includes('career')
      ? 2
      : name.includes('business')
        ? 0
        : index % ICONS.length
  const Icon = ICONS[icon]
  return <Icon className="size-5" />
}

// One team row: icon, title and text, and the address as a mail link.
export default function ContactCard({ title, description, email, index = 0 }: ContactCardProps) {
  const address = email.trim().toLowerCase()

  return (
    <div className="border-border grid grid-cols-[44px_minmax(0,1fr)] items-center gap-x-5 gap-y-4 border-t py-7 md:grid-cols-[44px_minmax(0,1fr)_auto]">
      <span className="bg-primary/16 grid size-11 place-items-center self-start rounded-xl text-[#7DB0FF] md:self-center">
        <TeamIcon title={title} index={index} />
      </span>
      <div className="min-w-0">
        <h2 data-display className="text-xl font-bold text-white/95">
          {title}
        </h2>
        <p className="mt-1.5 max-w-155 text-[15px] leading-6! text-white/65">{description}</p>
      </div>
      <a
        href={`mailto:${address}`}
        className="group/mail bg-background border-border col-start-2 inline-flex h-11 w-fit max-w-full items-center gap-2.5 rounded-[10px] border px-4 text-sm font-medium text-white/95 transition-colors outline-none hover:border-white/25 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/40 md:col-start-auto"
      >
        <Mail className="size-4 shrink-0 text-white/45" />
        <span className="truncate">{address}</span>
        <ArrowUpRight className="size-4 shrink-0 text-white/45 transition-transform group-hover/mail:translate-x-0.5 group-hover/mail:-translate-y-0.5" />
      </a>
    </div>
  )
}
