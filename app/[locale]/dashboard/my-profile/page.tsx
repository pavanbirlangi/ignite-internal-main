'use client'

import { ProfileForm } from './ProfileForm'
import { useUserStore } from '@/store/useUserStore'
import { AccountPageHeader } from '@/components/library/account-ui'

export default function MyProfile() {
  const user = useUserStore((state) => state.user)

  const initialData = {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    profilePhoto: user?.profile_photo || '',
    dob: user?.dob || '',
  }

  return (
    <div>
      <AccountPageHeader title="My Profile" subtitle="Your account details" />
      <ProfileForm initialData={initialData} />
    </div>
  )
}
