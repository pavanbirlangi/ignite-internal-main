'use client'

import React, { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { INPUT_CLASS } from './shared'
import { authService } from '@/lib/services/auth.service'
import { completeSignIn } from '@/lib/auth/complete-sign-in'
import { extractApiErrorMessage } from '@/lib/utils/api-error'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// The backend allows one code request per email every 60 seconds.
const RESEND_COOLDOWN_SECONDS = 60

const PRIMARY_BUTTON_CLASS =
  'bg-primary hover:bg-primary/90 mb-3 h-[48px] w-full cursor-pointer rounded-[6px] text-base font-bold text-white/95 transition-colors disabled:cursor-not-allowed disabled:opacity-50'
const LINK_BUTTON_CLASS =
  'text-primary hover:text-primary/80 cursor-pointer text-xs font-bold underline transition-colors focus:outline-none disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50'

// Passwordless sign-in: the customer gets one email with a 6-digit code and a magic link. Works for
// new and existing customers alike -- an unknown email becomes a new account.
//
// With `verifyEmail` set it is the email-verification step instead: a new password account must
// enter the code it was just sent before it can sign in. The form starts at the code step (the code
// is already on its way) and entering it verifies the email and signs the customer in.
export function EmailCodeForm({
  onSwitchToLogin,
  onSuccess,
  verifyEmail,
}: {
  onSwitchToLogin: () => void
  onSuccess?: () => void
  verifyEmail?: string | null
}) {
  const isVerify = Boolean(verifyEmail)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeSentTo, setCodeSentTo] = useState<string | null>(verifyEmail ?? null)
  const [cooldown, setCooldown] = useState(verifyEmail ? RESEND_COOLDOWN_SECONDS : 0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  const sendCode = async (target: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await authService.requestLoginCode(target, isVerify ? 'verify' : 'login')
      setCodeSentTo(target)
      setCode('')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Could not send the code. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const target = email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(target)) {
      setError('Please enter a valid email address.')
      return
    }
    void sendCode(target)
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codeSentTo) return
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from the email.')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      await completeSignIn(await authService.verifyLoginCode({ email: codeSentTo, code }))
      toast.success(isVerify ? 'Email verified. You are signed in.' : 'Login successful')
      onSuccess?.()
    } catch (err) {
      setError(extractApiErrorMessage(err, 'This code is invalid or has expired.'))
    } finally {
      setIsLoading(false)
    }
  }

  const errorText = error && (
    <span className="text-red mt-1 block text-xs font-bold">{error}</span>
  )

  if (!codeSentTo) {
    return (
      <form onSubmit={handleEmailSubmit} noValidate>
        <p className="text-white/65 mb-4 text-sm font-medium">
          We&apos;ll email you a 6-digit code and a sign-in link. No password needed.
        </p>
        <div className="mb-6">
          <Input
            type="email"
            placeholder="Enter Mail"
            className={`${INPUT_CLASS} auth-input`}
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errorText}
        </div>
        <button type="submit" disabled={isLoading} className={PRIMARY_BUTTON_CLASS}>
          {isLoading ? 'Sending...' : 'Send Code'}
        </button>
        <div className="flex justify-start">
          <button type="button" onClick={onSwitchToLogin} className={LINK_BUTTON_CLASS}>
            Sign in with password instead
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleCodeSubmit} noValidate>
      {isVerify ? (
        <p className="text-white/65 mb-4 text-sm font-medium">
          Please verify your email to finish setting up your account. We sent a 6-digit code to{' '}
          <span className="text-white/95">{codeSentTo}</span>. It expires in 10 minutes. You can also
          use the link in that email.
        </p>
      ) : (
        <p className="text-white/65 mb-4 text-sm font-medium">
          We sent a 6-digit code to <span className="text-white/95">{codeSentTo}</span>. It expires in
          10 minutes. You can also use the sign-in link in that email.
        </p>
      )}
      <div className="mb-6">
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Enter 6-digit code"
          maxLength={6}
          className={`${INPUT_CLASS} auth-input tracking-[0.3em] placeholder:tracking-normal`}
          aria-label="Sign-in code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          autoFocus
        />
        {errorText}
      </div>
      <button type="submit" disabled={isLoading} className={PRIMARY_BUTTON_CLASS}>
        {isLoading ? (isVerify ? 'Verifying...' : 'Signing in...') : isVerify ? 'Verify Email' : 'Sign In'}
      </button>
      <div className="flex items-center justify-between">
        {isVerify ? (
          <button type="button" onClick={onSwitchToLogin} className={LINK_BUTTON_CLASS}>
            Back to login
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setCodeSentTo(null)
              setError(null)
            }}
            className={LINK_BUTTON_CLASS}
          >
            Use a different email
          </button>
        )}
        <button
          type="button"
          disabled={isLoading || cooldown > 0}
          onClick={() => void sendCode(codeSentTo)}
          className={LINK_BUTTON_CLASS}
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </form>
  )
}
