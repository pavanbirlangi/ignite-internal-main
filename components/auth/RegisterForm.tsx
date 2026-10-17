'use client'

import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SocialButtons } from './SocialButtons'
import { Button } from '@/components/ui/button'
import {
  AuthFooter,
  FOOTER_ACTION_CLASS,
  Field,
  INPUT_CLASS,
  OrDivider,
  PASSWORD_TOGGLE_CLASS,
  SUBMIT_CLASS,
} from './shared'
import { authService } from '@/lib/services/auth.service'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { isPlausibleName } from '@/lib/utils/name-validation'
import { TurnstileWidget } from './TurnstileWidget'

const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .refine(isPlausibleName, 'Please enter a real name')

const registerSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Password must contain a letter')
      .regex(/[0-9]/, 'Password must contain a number'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
    // Honeypot -- invisible to real users (see the input below), bots that
    // blindly fill every field in a scraped form trip it. Real users should
    // never populate this, so any value at all is treated as a bot signal.
    website: z.string().max(0, 'Registration failed').optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password doesn't match",
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterForm({
  onSwitchToLogin,
  onSuccess,
}: {
  onSwitchToLogin: () => void
  // Called with the new account's email: it must be verified (the code is already emailed).
  onSuccess: (email: string) => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      website: '',
    },
  })

  const onSubmit = async (data: RegisterFormValues) => {
    if (data.website) {
      // Honeypot tripped -- fail quietly, no hint to the bot about why.
      toast.error('Registration failed')
      return
    }
    if (turnstileRequired && !turnstileToken) {
      toast.error('Please complete the verification challenge')
      return
    }

    setIsLoading(true)

    try {
      await authService.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        turnstileToken: turnstileToken ?? undefined,
      })
      toast.success('Account created. Check your email for a verification code.')
      onSuccess(data.email.trim().toLowerCase())
    } catch (err: any) {
      console.error('Registration failed:', err)
      const errorMessage = err.response?.data?.message || 'Registration failed'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <SocialButtons />
      <OrDivider />

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Honeypot -- hidden from real users via CSS + off the tab order,
            not just `type="hidden"` (some bots skip fields they can detect
            as hidden by type alone). */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
          {...register('website')}
        />

        <div className="mb-5 flex flex-col gap-4">
          <div className="flex gap-3">
            <Field label="First name" error={errors.firstName?.message} className="min-w-0 flex-1">
              <Input
                type="text"
                placeholder="First name"
                className={`${INPUT_CLASS} auth-input`}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                {...register('firstName')}
              />
            </Field>
            <Field label="Last name" error={errors.lastName?.message} className="min-w-0 flex-1">
              <Input
                type="text"
                placeholder="Last name"
                className={`${INPUT_CLASS} auth-input`}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                {...register('lastName')}
              />
            </Field>
          </div>

          <Field label="Email" error={errors.email?.message}>
            <Input
              type="email"
              placeholder="you@example.com"
              className={`${INPUT_CLASS} auth-input`}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              {...register('email')}
            />
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <span className="relative block">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                className={`${INPUT_CLASS} auth-input pr-10`}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className={PASSWORD_TOGGLE_CLASS}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </Field>

          <Field label="Confirm password" error={errors.confirmPassword?.message}>
            <span className="relative block">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                className={`${INPUT_CLASS} auth-input pr-10`}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className={PASSWORD_TOGGLE_CLASS}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </Field>
        </div>

        <div className="mb-4 empty:hidden">
          <TurnstileWidget onVerify={setTurnstileToken} />
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={turnstileRequired && !turnstileToken}
          className={SUBMIT_CLASS}
        >
          Create account
        </Button>
      </form>

      <AuthFooter>
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className={FOOTER_ACTION_CLASS}>
          Log in
        </button>
      </AuthFooter>
    </>
  )
}
