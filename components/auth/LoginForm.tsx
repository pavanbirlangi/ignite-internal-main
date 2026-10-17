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
  LINK_CLASS,
  OrDivider,
  PASSWORD_TOGGLE_CLASS,
  SUBMIT_CLASS,
} from './shared'
import { authService, isEmailNotVerifiedError } from '@/lib/services/auth.service'
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
  onSwitchToEmailCode,
  onEmailNotVerified,
  onLoginSuccess,
}: {
  onSwitchToRegister: () => void
  onSwitchToRecover?: () => void
  onSwitchToEmailCode?: () => void
  // The password was right but the account's email isn't verified yet: show the code step.
  onEmailNotVerified?: (email: string) => void
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
      if (isEmailNotVerifiedError(err) && onEmailNotVerified) {
        const email = data.email.trim().toLowerCase()
        // A code may already be on its way (e.g. right after signup): a "wait 60 seconds"
        // answer still means the customer has a recent code, so show the code step either way.
        try {
          await authService.requestLoginCode(email, 'verify')
        } catch (codeError) {
          console.error('Could not send a verification code:', codeError)
        }
        toast.info('Please verify your email. We sent you a code.')
        onEmailNotVerified(email)
        return
      }
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

        <div className="mb-5 flex flex-col gap-4">
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
                placeholder="Your password"
                className={`${INPUT_CLASS} auth-input pr-10`}
                autoComplete="new-password"
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
        </div>

        <Button type="submit" variant="primary" loading={isLoading} className={SUBMIT_CLASS}>
          Log in
        </Button>
        <div className="mt-4 flex items-center justify-between gap-4">
          <button type="button" onClick={onSwitchToRecover} className={LINK_CLASS}>
            Forgot password?
          </button>
          {onSwitchToEmailCode && (
            <button type="button" onClick={onSwitchToEmailCode} className={LINK_CLASS}>
              Email me a code
            </button>
          )}
        </div>
      </form>

      <AuthFooter>
        New here?{' '}
        <button type="button" onClick={onSwitchToRegister} className={FOOTER_ACTION_CLASS}>
          Create an account
        </button>
      </AuthFooter>
    </>
  )
}
