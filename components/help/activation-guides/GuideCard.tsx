import Link from 'next/link'

export interface GuideCardProps {
  id: string
  title: string
  date: string
  image: string
  href: string
}

export default function GuideCard({
  title,
  date,
  image,
  href,
}: GuideCardProps) {
  return (
    <Link href={href} className="group flex flex-col gap-4">
      {/* Image Container */}
      <div className="bg-background relative aspect-video w-full overflow-hidden rounded-[12px]">
        <img
          src={image}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 px-0.5">
        <h3 className="group-hover:underline line-clamp-2 text-[20px] leading-tight font-semibold text-white transition-colors">
          {title}
        </h3>
        <span className="text-primary text-[14px] font-semibold">{date}</span>
      </div>
    </Link>
  )
}
