'use client'

import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SocialButtons } from './SocialButtons'
import { INPUT_CLASS, OrDivider } from './shared'
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
  onSuccess: () => void
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
      toast.success('Registration successful')
      onSuccess()
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

        {/* Inputs */}
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="First Name"
                className={`${INPUT_CLASS} auth-input`}
                 autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
                {...register('firstName')}
              />
              {errors.firstName && (
                <span className="text-red mt-1 block text-xs font-semibold">
                  {errors.firstName.message}
                </span>
              )}
            </div>
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Last Name"
                className={`${INPUT_CLASS} auth-input`}
                 autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
                {...register('lastName')}
              />
              {errors.lastName && (
                <span className="text-red mt-1 block text-xs font-semibold">
                  {errors.lastName.message}
                </span>
              )}
            </div>
          </div>

          <div>
            <Input
              type="email"
              placeholder="Enter Email"
              className={`${INPUT_CLASS} auth-input`}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              {...register('email')}
            />
            {errors.email && (
              <span className="text-red mt-1 block text-xs font-semibold">
                {errors.email.message}
              </span>
            )}
          </div>

          <div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter Password"
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
                className="text-muted-foreground absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center p-1 transition-colors hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <span className="text-red mt-1 block text-xs font-semibold">
                {errors.password.message}
              </span>
            )}
          </div>

          <div>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                className={`${INPUT_CLASS} auth-input pr-10`}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-muted-foreground absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center p-1 transition-colors hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-red mt-1 block text-xs font-semibold">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <TurnstileWidget onVerify={setTurnstileToken} />
        </div>

        {/* CTA */}
        <div className="pb-6">
          <button
            type="submit"
            disabled={isLoading || (turnstileRequired && !turnstileToken)}
            className="bg-primary hover:bg-primary/90 mb-3 h-[48px] w-full cursor-pointer rounded-[6px] text-base font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </div>
      </form>

      <OrDivider />
      <SocialButtons />

      <button
        onClick={onSwitchToLogin}
        className="border-muted-foreground h-[48px] w-full cursor-pointer rounded-[6px] border-[0.78px] bg-transparent text-base font-semibold text-white transition-all hover:bg-white/5"
      >
        Login Existing Account
      </button>
    </>
  )
}
