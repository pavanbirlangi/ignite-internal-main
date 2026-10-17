import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { User } from '@/store/useUserStore'

// The signed-in customer's profile photo, or their initials on a blue circle when they have none.
export function UserAvatar({
  user,
  className,
}: {
  user: User
  className?: string
}) {
  const initials =
    [user.firstName, user.lastName]
      .map((part) => part?.trim()?.[0] ?? '')
      .join('')
      .toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    '?'

  return (
    <span
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'from-primary bg-linear-to-br to-[#1D4ED8] font-bold text-white/95',
        className,
      )}
    >
      {user.profile_photo ? (
        <Image
          src={user.profile_photo}
          alt=""
          fill
          sizes="48px"
          className="object-cover"
        />
      ) : (
        <span className="trim leading-none">{initials}</span>
      )}
    </span>
  )
}
