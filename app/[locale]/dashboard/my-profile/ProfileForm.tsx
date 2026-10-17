'use client'

import { cn } from '@/lib/utils'
import {
  ACCOUNT_CARD_CLASS,
  ACCOUNT_INPUT_CLASS,
  ACCOUNT_TEXT_BUTTON_CLASS,
  StatusPill,
} from '@/components/library/account-ui'
import { Loader2, CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { EditableProfileField } from '@/components/profile/EditableProfileField'
import { PhoneInput } from '@/components/profile/PhoneInput'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { useProfileForm, ProfileFormData } from '@/hooks/useProfileForm'
import {
  MAX_PROFILE_IMAGE_SIZE,
  extractApiErrorMessage,
} from '@/lib/utils/profile.utils'

interface ProfileFormProps {
  initialData: ProfileFormData
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const {
    displayName,
    email,
    phone,
    dob,
    profilePhoto,
    isSendingReset,
    resetSent,
    isUploadingImage,
    isDeletingImage,
    handleSaveName,
    handleSavePhone,
    handleSaveDob,
    handleUploadImage,
    handleDeleteImage,
    handleResetPassword,
  } = useProfileForm(initialData)



  return (
    <div className={cn(ACCOUNT_CARD_CLASS, 'flex flex-col overflow-hidden')}>
      <ProfileAvatar
        displayName={displayName}
        email={email}
        profilePhoto={profilePhoto}
        isUploadingImage={isUploadingImage}
        isDeletingImage={isDeletingImage}
        onUpload={handleUploadImage}
        onDelete={handleDeleteImage}
        maxSizeBytes={MAX_PROFILE_IMAGE_SIZE}
      />

      <EditableProfileField
        label="Display Name"
        value={displayName}
        onSave={async (newValue) => {
          try {
            await handleSaveName(newValue)
          } catch (error: any) {
            toast.error(
              extractApiErrorMessage(error, 'Failed to update display name'),
            )
            throw error
          }
        }}
      />

      {/* Email Address Section */}
      <EditableProfileField
        label="Email Address"
        value={email}
        readOnly
        customAction={
          <StatusPill tone="success">Verified</StatusPill>
        }
      />

      <EditableProfileField
        label="Phone Number"
        value={phone}
        onSave={async (newValue) => {
          try {
            await handleSavePhone(newValue)
          } catch (error: any) {
            toast.error(
              extractApiErrorMessage(error, 'Failed to update phone number'),
            )
            throw error
          }
        }}
        renderEdit={(value, onChange) => (
          <PhoneInput value={value} onChange={onChange} />
        )}
      />

      {/* Date of Birth Section */}
      <EditableProfileField
        label="Date of Birth"
        value={dob}
        onSave={async (newValue) => {
          try {
            await handleSaveDob(newValue)
          } catch (error: any) {
            toast.error(
              extractApiErrorMessage(error, 'Failed to update date of birth'),
            )
            throw error
          }
        }}
        renderEdit={(value, onChange) => {
          const date =
            value && !isNaN(new Date(value).getTime())
              ? new Date(value)
              : undefined
          return (
            <div className="relative w-full">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      ACCOUNT_INPUT_CLASS,
                      'flex cursor-pointer items-center gap-2 text-left',
                      !date && 'text-white/45',
                    )}
                  >
                    <CalendarIcon className="size-4 text-white/65" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => onChange(d ? format(d, 'yyyy-MM-dd') : '')}
                    initialFocus
                    captionLayout="dropdown"
                    startMonth={new Date(1900, 0)}
                    endMonth={new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )
        }}
      />

      {/* Password Section */}
      <EditableProfileField
        label="Password"
        readOnly
        customAction={
          resetSent ? (
            <StatusPill tone="success">Link sent</StatusPill>
          ) : (
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={isSendingReset}
              className={ACCOUNT_TEXT_BUTTON_CLASS}
            >
              {isSendingReset ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Sending...
                </>
              ) : (
                'Change password'
              )}
            </button>
          )
        }
        renderDisplay={() => (
          <p className="text-sm! leading-5! font-medium text-white/65">
            {resetSent
              ? 'Check your inbox for the reset link'
              : 'We email a reset link to your registered address'}
          </p>
        )}
      />
    </div>
  )
}
