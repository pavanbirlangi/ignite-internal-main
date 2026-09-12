'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
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
  const initial = (displayName || email || '-').trim().charAt(0).toUpperCase()

  return (
    <div className="border-muted-foreground flex flex-col items-start gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
      {/* Avatar */}
      <div className="bg-primary relative flex h-20 w-20 items-center justify-center overflow-hidden rounded text-2xl md:text-3xl font-semibold text-white">
        {profilePhoto ? (
          <img
            src={profilePhoto}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          initial
        )}
      </div>

      {/* Actions */}
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        {profilePhoto && (
          <Button
            variant="outline"
            className="w-full rounded-[6px] px-6 py-4.5 text-base font-semibold sm:w-44"
            onClick={onDelete}
            disabled={isBusy}
          >
            {isDeletingImage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removing...
              </>
            ) : (
              'Remove'
            )}
          </Button>
        )}

        <Button
          variant="secondary"
          className="w-full rounded-[6px] px-6 py-4.5 text-base font-semibold sm:w-44"
          onClick={handleSelectFile}
          disabled={isBusy}
        >
          {isUploadingImage ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
            </>
          ) : (
            'Update'
          )}
        </Button>
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
