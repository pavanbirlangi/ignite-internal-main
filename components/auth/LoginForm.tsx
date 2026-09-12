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
import Cookies from 'js-cookie'
import { useUserStore } from '@/store/useUserStore'
import { useCartStore } from '@/store/useCartStore'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm({
  onSwitchToRegister,
  onSwitchToRecover,
  onLoginSuccess,
}: {
  onSwitchToRegister: () => void
  onSwitchToRecover?: () => void
  onLoginSuccess?: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)

    try {
      const response = await authService.login({
        email: data.email,
        password: data.password,
      })

      // Store token in cookies
      Cookies.set('access_token', response.token.accessToken, {
        expires: new Date(response.token.expiresAt),
        path: '/',
      })

      // Update user store
      useUserStore.getState().setIsAuthenticated(true)

      // Transfer guest cart to user if applicable
      try {
        await useCartStore.getState().transferGuestCartToUser()
      } catch (cartError) {
        console.error('Failed to transfer cart during login', cartError)
      }

      toast.success('Login successful')

      if (onLoginSuccess) {
        onLoginSuccess()
      }
    } catch (err: any) {
      console.error('Login failed:', err)
      const errorMessage =
        err.response?.data?.message || 'Invalid email or password'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
        <input
          type="text"
          name="username"
          autoComplete="username"
          tabIndex={-1}
          className="hidden"
          aria-hidden="true"
        />
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          tabIndex={-1}
          className="hidden"
          aria-hidden="true"
        />
        <SocialButtons />
        <OrDivider />

        {/* Inputs */}
        <div className="mb-6 flex flex-col gap-3">
          <div>
            <Input
              type="email"
              placeholder="Enter Mail"
              className={`${INPUT_CLASS} auth-input`}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Email address"
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
                autoComplete="new-password"
                aria-label="Password"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
        </div>

        {/* CTA */}
        <div className="border-muted-foreground mb-6 border-b-[0.5px] pb-6">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 mb-3 h-[48px] w-full cursor-pointer rounded-[6px] text-base font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          <div className="flex justify-start">
            <button
              type="button"
              onClick={onSwitchToRecover}
              className="text-primary hover:text-primary/80 cursor-pointer text-xs font-semibold underline transition-colors focus:outline-none"
            >
              Forgot password?
            </button>
          </div>
        </div>
      </form>

      <button
        onClick={onSwitchToRegister}
        className="border-muted-foreground h-[48px] w-full cursor-pointer rounded-[6px] border-[0.78px] bg-transparent text-base font-semibold text-white transition-all hover:bg-white/5"
      >
        Create New Account
      </button>
    </>
  )
}
