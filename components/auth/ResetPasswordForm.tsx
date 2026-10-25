'use client'

import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, INPUT_CLASS, PASSWORD_TOGGLE_CLASS, SUBMIT_CLASS } from './shared'
import { authService } from '@/lib/services/auth.service'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import Cookies from 'js-cookie'
import { useUserStore } from '@/store/useUserStore'
import { useRouter } from 'next/navigation'

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type ResetFormValues = z.infer<typeof resetSchema>

// `setup`: the customer signs in with Google or an email code and is choosing a first password
// (the "set a password" email links here with &set=1, R-94); only the wording differs.
export function ResetPasswordForm({ token, setup = false }: { token: string; setup?: boolean }) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: ResetFormValues) => {
    setIsLoading(true)

    try {
      const response = await authService.resetPassword({
        token,
        password: data.password,
      })

      if (response.token) {
        Cookies.set('access_token', response.token.accessToken, {
          expires: new Date(response.token.expiresAt),
          path: '/',
        })

        useUserStore.getState().setIsAuthenticated(true)

        toast.success(
          setup
            ? 'Password set. You can now also sign in with your email and password.'
            : 'Password reset successful. You are now logged in.',
        )
        router.push('/')
      } else {
        toast.success(
          setup
            ? 'Password set. Please sign in with your email and new password.'
            : 'Password updated. Please log in with your new password.',
        )
        router.push('/')
      }
    } catch (err: any) {
      console.error('Reset failed:', err)
      const message =
        err?.response?.data?.message ||
        `This ${setup ? 'link' : 'reset link'} is invalid or has expired. Please request a new one.`
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <div className="mb-5 flex flex-col gap-4">
        <Field label={setup ? 'Password' : 'New password'} error={errors.password?.message}>
          <span className="relative block">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              className={`${INPUT_CLASS} pr-10`}
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

        <Field label={setup ? 'Confirm password' : 'Confirm new password'} error={errors.confirmPassword?.message}>
          <span className="relative block">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repeat your password"
              className={`${INPUT_CLASS} pr-10`}
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

      <Button type="submit" variant="primary" loading={isLoading} className={SUBMIT_CLASS}>
        {setup ? 'Set password' : 'Reset password'}
      </Button>
    </form>
  )
}
