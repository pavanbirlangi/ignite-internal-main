'use client'

import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { INPUT_CLASS } from './shared'
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

export function ResetPasswordForm({ token }: { token: string }) {
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

        toast.success('Password reset successful. You are now logged in.')
        router.push('/')
      } else {
        toast.success('Password updated. Please log in with your new password.')
        router.push('/')
      }
    } catch (err: any) {
      console.error('Reset failed:', err)
      const message =
        err?.response?.data?.message ||
        'This reset link is invalid or has expired. Please request a new one.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="New Password"
              className={`${INPUT_CLASS} pr-10`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-se hover:text-muted-foreground/80 absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center p-1 transition-colors"
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
              placeholder="Confirm New Password"
              className={`${INPUT_CLASS} pr-10`}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-se hover:text-muted-foreground/80 absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center p-1 transition-colors"
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

      <button
        type="submit"
        disabled={isLoading}
        className="bg-primary hover:bg-primary/90 h-12 w-full cursor-pointer rounded-[6px] text-base font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Resetting Password...' : 'Reset Password'}
      </button>
    </form>
  )
}
