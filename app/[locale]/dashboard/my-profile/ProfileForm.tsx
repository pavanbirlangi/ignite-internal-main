'use client'

import { Button } from '@/components/ui/button'
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
    <div className="glassmorphism bg-background/60 flex flex-col gap-6 rounded-[20px] px-4 py-4 sm:px-5">
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
          <div className="bg-destructive rounded-[6px] px-3 py-2 text-xs font-semibold text-white">
            VERIFIED
          </div>
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
                  <Button
                    variant="outline"
                    className={`bg-secondary hover:bg-secondary/80 focus:bg-secondary w-full justify-start rounded-[6px] border-none px-3 py-3.5 text-left text-xs! font-medium text-white ${!date ? 'text-muted-foreground' : ''}`}
                    style={{ height: 'auto' }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
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
        className="border-none pb-2"
        readOnly
        customAction={
          <Button
            variant={resetSent ? 'outline' : 'secondary'}
            className={`w-full rounded-[6px] text-base font-semibold sm:w-44 ${resetSent ? 'border-destructive text-destructive' : ''}`}
            onClick={handleResetPassword}
            disabled={isSendingReset || resetSent}
          >
            {isSendingReset ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
              </>
            ) : resetSent ? (
              'Link Sent'
            ) : (
              'Change Password'
            )}
          </Button>
        }
        renderDisplay={() => (
          <div className="bg-secondary text-muted-foreground w-full rounded-[6px] p-3 text-xs! font-medium sm:max-w-md">
            Reset link will be sent on registered mail
          </div>
        )}
      />
    </div>
  )
}
