'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authService } from '@/lib/services/auth.service'
import { completeSignIn } from '@/lib/auth/complete-sign-in'
import { useAuthModalStore } from '@/store/useAuthModalStore'

// Signs the customer in from the link in their sign-in email. The link works once, so the
// verification is guarded against running twice (React's dev double-mount, a re-render).
export function MagicLinkSignIn({ token }: { token: string }) {
  const router = useRouter()
  const openModal = useAuthModalStore((state) => state.openModal)
  const startedRef = useRef(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    authService
      .verifyLoginCode({ token })
      .then(completeSignIn)
      .then(() => {
        toast.success('Login successful')
        router.replace('/')
      })
      .catch((error) => {
        console.error('Magic-link sign-in failed', error)
        setFailed(true)
      })
  }, [token, router])

  if (!failed) {
    return <p className="text-white/65 text-sm">Signing you in...</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-red text-sm font-bold">
        This sign-in link is invalid or has expired. Links work once and for 10 minutes. You can
        still use the 6-digit code from the same email, or get a new one.
      </p>
      <button
        type="button"
        onClick={() => openModal('email-code')}
        className="bg-primary hover:bg-primary/90 h-[48px] w-full cursor-pointer rounded-[6px] text-base font-bold text-white/95 transition-colors"
      >
        Get a New Code
      </button>
    </div>
  )
}
