export interface ContactCardProps {
  title: string
  description: string
  email: string
}

export default function ContactCard({
  title,
  description,
  email,
}: ContactCardProps) {
  return (
    <div className="bg-secondary/20 flex flex-col gap-6 rounded-[20px] px-5 py-4">
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold text-white/95">
          {title}
        </h2>
        <p className="text-white/65 text-base">
          {description}
        </p>
      </div>
      <a
        href={`mailto:${email}`}
        className="text-primary hover:text-primary/80 text-base font-bold transition-colors"
      >
        {email}
      </a>
    </div>
  )
}
