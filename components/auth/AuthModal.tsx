'use client'

import React, { useEffect } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { X } from 'lucide-react'

import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { RecoverForm } from './RecoverForm'
import { RecoverEmailSent } from './RecoverEmailSent'
import { EmailCodeForm } from './EmailCodeForm'
import { AuthMode, useAuthModalStore } from '@/store/useAuthModalStore'
import { AuthFooter, FOOTER_ACTION_CLASS } from './shared'

const TITLES: Record<AuthMode, { title: string; subtitle: string }> = {
  login: { title: 'Log in', subtitle: 'Welcome back to Increddy' },
  register: { title: 'Create an account', subtitle: 'Your orders, keys and wishlist in one place' },
  recover: { title: 'Reset your password', subtitle: "We'll email you a link to set a new one" },
  'recover-email-sent': { title: 'Check your email', subtitle: 'A reset link is on its way' },
  'email-sent': { title: 'Check your email', subtitle: 'Confirm your address to finish' },
  'email-code': { title: 'Sign in with a code', subtitle: 'No password needed' },
  'verify-email': { title: 'Verify your email', subtitle: 'One last step to finish your account' },
}

export default function AuthModal({
  children,
  defaultMode = 'login',
}: {
  children: React.ReactNode
  defaultMode?: AuthMode
}) {
  const { open, mode, verifyEmail, openModal, closeModal, setMode, showVerifyEmail } =
    useAuthModalStore()

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      openModal(defaultMode)
      return
    }

    closeModal()
  }

  useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(() => setMode('login'), 300)
      return () => window.clearTimeout(timer)
    }
  }, [open, setMode])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="border-border bg-card scrollbar-hide no-scrollbar max-h-[90vh] overflow-y-auto p-0 text-white/95 shadow-2xl sm:max-w-105 sm:rounded-2xl"
      >
        <div className="p-6 sm:p-7">
          <DialogHeader className="mb-5 flex flex-row items-start justify-between gap-4 text-left">
            <div>
              <DialogTitle className="text-xl font-bold text-white/95">
                {TITLES[mode].title}
              </DialogTitle>
              <p className="mt-1 text-sm text-white/65">{TITLES[mode].subtitle}</p>
            </div>
            {/* Same close button as the currency picker: round, clear hover,
                focus ring only for keyboard users. */}
            <DialogClose
              aria-label="Close"
              className="group/close grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-white/5 transition-colors outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <X
                className="size-[18px] text-white/65 transition-colors group-hover/close:text-white"
                strokeWidth={2}
              />
            </DialogClose>
          </DialogHeader>

          {mode === 'login' && (
            <LoginForm
              onSwitchToRegister={() => setMode('register')}
              onSwitchToRecover={() => setMode('recover')}
              onSwitchToEmailCode={() => setMode('email-code')}
              onEmailNotVerified={showVerifyEmail}
              onLoginSuccess={() => handleOpenChange(false)}
            />
          )}
          {mode === 'register' && (
            <RegisterForm
              onSwitchToLogin={() => setMode('login')}
              onSuccess={showVerifyEmail}
            />
          )}
          {mode === 'recover' && (
            <RecoverForm
              onSwitchToLogin={() => setMode('login')}
              onSuccess={() => setMode('recover-email-sent')}
            />
          )}
          {mode === 'recover-email-sent' && (
            <>
              <RecoverEmailSent />
              <AuthFooter>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={FOOTER_ACTION_CLASS}
                >
                  Back to log in
                </button>
              </AuthFooter>
            </>
          )}
          {mode === 'email-code' && (
            <EmailCodeForm
              onSwitchToLogin={() => setMode('login')}
              onSuccess={() => handleOpenChange(false)}
            />
          )}
          {mode === 'verify-email' && verifyEmail && (
            <EmailCodeForm
              key={verifyEmail}
              verifyEmail={verifyEmail}
              onSwitchToLogin={() => setMode('login')}
              onSuccess={() => handleOpenChange(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
