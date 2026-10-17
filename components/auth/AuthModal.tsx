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
        className="border-secondary bg-secondary/40 scrollbar-hide no-scrollbar max-h-[90vh] overflow-y-auto p-0 text-white/95 shadow-2xl backdrop-blur-2xl sm:max-w-165 sm:rounded-[30px]"
      >
        <div className="p-6 sm:p-10">
          <DialogHeader className="border-secondary mb-6 flex flex-row items-center justify-between border-b pb-4">
            <DialogTitle className="text-xl font-bold text-white/95 md:text-2xl">
              {mode === 'login' && 'Login Into Account'}
              {mode === 'register' && 'Register New Account'}
              {mode === 'recover' && 'Recover Password'}
              {mode === 'recover-email-sent' && 'Confirm Registered Mail'}
              {mode === 'email-code' && 'Sign In With Email Code'}
              {mode === 'verify-email' && 'Verify Your Email'}
            </DialogTitle>
            <DialogClose className="cursor-pointer rounded-full transition-colors hover:bg-white/10">
              <X className="text-white/65 h-4 w-4" strokeWidth={2.5} />
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
          {mode === 'recover-email-sent' && <RecoverEmailSent />}
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
