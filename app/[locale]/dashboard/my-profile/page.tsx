'use client'

import { ProfileForm } from './ProfileForm'
import { useUserStore } from '@/store/useUserStore'

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
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold md:text-3xl">My Profile</h1>

      <div className="mt-2">
        <h2 className="text-white/65 mb-6 text-xl md:text-2xl font-bold">
          Personal Details
        </h2>

        <ProfileForm initialData={initialData} />
      </div>
    </div>
  )
}
