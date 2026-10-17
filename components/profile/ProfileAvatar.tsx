'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'
import {
  ACCOUNT_SECONDARY_BUTTON_CLASS,
  ACCOUNT_TEXT_BUTTON_CLASS,
} from '@/components/library/account-ui'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ProfileAvatarProps {
  displayName: string
  email: string
  profilePhoto: string
  isUploadingImage: boolean
  isDeletingImage: boolean
  onUpload: (file: File) => Promise<void>
  onDelete: () => Promise<void>
  maxSizeBytes: number
}

export function ProfileAvatar({
  displayName,
  email,
  profilePhoto,
  isUploadingImage,
  isDeletingImage,
  onUpload,
  onDelete,
  maxSizeBytes,
}: ProfileAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > maxSizeBytes) {
      const maxSizeMb = Math.round(maxSizeBytes / (1024 * 1024))
      toast.error(`Image size must be ${maxSizeMb}MB or less`)
      event.target.value = ''
      return
    }

    try {
      await onUpload(file)
    } finally {
      event.target.value = ''
    }
  }

  const isBusy = isUploadingImage || isDeletingImage
  const name = displayName.trim()
  const initials =
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase() ||
    email.trim().charAt(0).toUpperCase() ||
    '-'

  return (
    <div className="flex flex-wrap items-center gap-4 p-5">
      <div className="from-primary relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br to-[#1D4ED8] text-xl font-bold text-white/95">
        {profilePhoto ? (
          <img
            src={profilePhoto}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="trim leading-none">{initials}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-white/95">{name || email}</p>
        {name && <p className="truncate text-sm! text-white/65">{email}</p>}
      </div>

      <div className="flex w-full gap-2 sm:w-auto">
        {profilePhoto && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isBusy}
            className={cn(ACCOUNT_TEXT_BUTTON_CLASS, 'h-10 px-3')}
          >
            {isDeletingImage ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Removing...
              </>
            ) : (
              'Remove'
            )}
          </button>
        )}

        <button
          type="button"
          onClick={handleSelectFile}
          disabled={isBusy}
          className={cn(ACCOUNT_SECONDARY_BUTTON_CLASS, 'flex-1 sm:flex-none')}
        >
          {isUploadingImage ? (
            <>
              <Loader2 className="animate-spin" /> Uploading...
            </>
          ) : (
            'Change photo'
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
