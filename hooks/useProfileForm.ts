import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { authService, UpdateAccountPayload } from '@/lib/services/auth.service'
import { useUserStore } from '@/store/useUserStore'
import {
  MAX_PROFILE_IMAGE_SIZE,
  extractApiErrorMessage,
  normalizeProfilePhotoValue,
  splitDisplayName,
  validatePhoneValue,
  validateDobValue,
} from '@/lib/utils/profile.utils'

export interface ProfileFormData {
  firstName: string
  lastName: string
  displayName: string
  email: string
  phone: string
  profilePhoto: string
  profilePhotoId: string
  dob: string
}

export function useProfileForm(initialData: ProfileFormData) {
  const setUser = useUserStore((state) => state.setUser)

  const [firstName, setFirstName] = useState(initialData.firstName)
  const [lastName, setLastName] = useState(initialData.lastName)
  const [displayName, setDisplayName] = useState(
    initialData.displayName ||
      `${initialData.firstName} ${initialData.lastName}`.trim(),
  )
  const [email, setEmail] = useState(initialData.email)
  const [phone, setPhone] = useState(initialData.phone)
  const [dob, setDob] = useState(initialData.dob)
  const [profilePhoto, setProfilePhoto] = useState(initialData.profilePhoto)
  const [profilePhotoId, setProfilePhotoId] = useState(initialData.profilePhotoId)

  const [isSendingReset, setIsSendingReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isDeletingImage, setIsDeletingImage] = useState(false)

  useEffect(() => {
    setFirstName(initialData.firstName)
    setLastName(initialData.lastName)
    setDisplayName(
      initialData.displayName ||
        `${initialData.firstName} ${initialData.lastName}`.trim(),
    )
    setEmail(initialData.email)
    setPhone(initialData.phone)
    setDob(initialData.dob)
    setProfilePhoto(initialData.profilePhoto)
    setProfilePhotoId(initialData.profilePhotoId)
  }, [
    initialData.firstName,
    initialData.lastName,
    initialData.displayName,
    initialData.email,
    initialData.phone,
    initialData.dob,
    initialData.profilePhoto,
    initialData.profilePhotoId,
  ])

  const applyAccount = (account: {
    id: string
    firstName: string
    lastName: string
    displayName: string
    email: string
    phone: string | null
    profile_photo: string | null
    profile_photo_id: string | null
    dob: string | null
  }) => {
    setFirstName(account.firstName)
    setLastName(account.lastName)
    setDisplayName(
      account.displayName || `${account.firstName} ${account.lastName}`.trim(),
    )
    setEmail(account.email)
    setPhone(account.phone || '')
    setDob(account.dob || '')
    setProfilePhoto(account.profile_photo || '')
    setProfilePhotoId(account.profile_photo_id || '')
    setUser(account)
  }

  const getPayload = (
    overrides: Partial<UpdateAccountPayload> = {},
  ): UpdateAccountPayload => {
    const nextPayload: UpdateAccountPayload = {
      firstName,
      lastName,
      email,
      ...overrides,
    }

    // Only include phone/dob if they have a value or are explicitly overridden
    // The API rejects blank phone, so omit it entirely when empty
    if ('phone' in overrides) {
      nextPayload.phone = overrides.phone
    } else if (phone) {
      nextPayload.phone = phone
    }

    if ('dob' in overrides) {
      nextPayload.dob = overrides.dob
    } else if (dob) {
      nextPayload.dob = dob
    }

    // If profile_photo override is explicitly null, send empty string to clear it
    if (overrides.profile_photo === null) {
      nextPayload.profile_photo = ''
      return nextPayload
    }

    const photoSource =
      overrides.profile_photo !== undefined
        ? overrides.profile_photo
        : profilePhoto

    const normalizedPhoto = normalizeProfilePhotoValue(photoSource)

    if (normalizedPhoto) {
      nextPayload.profile_photo = normalizedPhoto
    } else {
      delete nextPayload.profile_photo
    }

    return nextPayload
  }

  const updateAccount = async (
    payload: UpdateAccountPayload,
    successMessage: string,
  ) => {
    try {
      await authService.updateAccount(payload)

      try {
        const latestAccount = await authService.getAccount()
        applyAccount(latestAccount)
      } catch {
        applyAccount({
          id: '',
          firstName: payload.firstName ?? firstName,
          lastName: payload.lastName ?? lastName,
          displayName:
            payload.firstName || payload.lastName
              ? `${payload.firstName ?? firstName} ${payload.lastName ?? lastName}`.trim()
              : displayName,
          email: payload.email ?? email,
          phone: payload.phone ?? phone,
          profile_photo:
            payload.profile_photo !== undefined
              ? payload.profile_photo ?? ''
              : profilePhoto,
          profile_photo_id: profilePhotoId || null,
          dob: payload.dob ?? dob,
        })
      }

      toast.success(successMessage)
    } catch (error) {
      throw error
    }
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSaveName = async (newValue: string) => {
    const nameParts = splitDisplayName(newValue)
    if (!nameParts.firstName) {
      toast.error('Display name cannot be empty')
      throw new Error('Display name cannot be empty')
    }
    await updateAccount(
      getPayload({
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
      }),
      'Display name updated',
    )
  }

  const handleSavePhone = async (newValue: string) => {
    const normalizedPhone = validatePhoneValue(newValue)
    await updateAccount(
      getPayload({ phone: normalizedPhone }),
      'Phone number updated',
    )
  }

  const handleSaveDob = async (newValue: string) => {
    const normalizedDob = validateDobValue(newValue)
    await updateAccount(
      getPayload({ dob: normalizedDob }),
      'Date of birth updated',
    )
  }

  const handleUploadImage = async (file: File) => {
    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      toast.error('Image size must be 5MB or less')
      return
    }

    setIsUploadingImage(true)
    try {
      const { gid } = await authService.uploadAccountImage(file)
      await updateAccount(
        getPayload({ profile_photo: normalizeProfilePhotoValue(gid) }),
        'Profile image updated',
      )
    } catch (error: any) {
      console.error('Failed to upload profile image:', error)
      toast.error(
        extractApiErrorMessage(error, 'Failed to upload profile image'),
      )
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleDeleteImage = async () => {
    if (!profilePhoto && !profilePhotoId) return

    const gid = profilePhotoId
    if (!gid) {
      toast.error('Cannot delete image: missing image identifier')
      return
    }

    setIsDeletingImage(true)
    try {
      await authService.deleteAccountImage({ gid })

      // Refresh other account fields from server
      try {
        const latestAccount = await authService.getAccount()
        applyAccount({ ...latestAccount, profile_photo: null, profile_photo_id: null })
      } catch {
        // Fallback: just clear photo locally
        setProfilePhoto('')
        setProfilePhotoId('')
      }
      toast.success('Profile image removed')
    } catch (error: any) {
      console.error('Failed to delete profile image:', error)
      toast.error(
        extractApiErrorMessage(error, 'Failed to remove profile image'),
      )
    } finally {
      setIsDeletingImage(false)
    }
  }

  const handleResetPassword = async () => {
    setIsSendingReset(true)
    try {
      await authService.recover({ email })
      setResetSent(true)
      toast.success('Reset link sent to your registered email')
      setTimeout(() => setResetSent(false), 5000)
    } catch (error: any) {
      console.error('Failed to send reset link:', error)
      toast.error(error.response?.data?.message || 'Failed to send reset link')
    } finally {
      setIsSendingReset(false)
    }
  }

  return {
    // state
    displayName,
    email,
    phone,
    dob,
    profilePhoto,
    isSendingReset,
    resetSent,
    isUploadingImage,
    isDeletingImage,
    // handlers
    handleSaveName,
    handleSavePhone,
    handleSaveDob,
    handleUploadImage,
    handleDeleteImage,
    handleResetPassword,
  }
}
