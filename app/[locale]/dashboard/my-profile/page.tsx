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
      <h1 className="text-[28px] font-semibold md:text-[40px]">My Profile</h1>

      <div className="mt-2">
        <h2 className="text-muted-foreground mb-6 text-xl md:text-2xl leading-10 font-semibold">
          Personal Details
        </h2>

        <ProfileForm initialData={initialData} />
      </div>
    </div>
  )
}
