'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AuthFooter, FOOTER_ACTION_CLASS, Field, INPUT_CLASS, SUBMIT_CLASS } from './shared'
import { authService } from '@/lib/services/auth.service'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'

const recoverSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
})

type RecoverFormValues = z.infer<typeof recoverSchema>

export function RecoverForm({
  onSwitchToLogin,
  onSuccess,
}: {
  onSwitchToLogin: () => void
  onSuccess: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecoverFormValues>({
    resolver: zodResolver(recoverSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: RecoverFormValues) => {
    setIsLoading(true)

    try {
      const response = await authService.recover({ email: data.email })
      toast.success(response.message || 'Recovery email sent')
      onSuccess() // Switch to the "Confirm Registered Mail" view
    } catch (err: any) {
      console.error('Recovery failed:', err)
      const errorMessage =
        err.response?.data?.message || 'Failed to send recovery email'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <p className="mb-5 text-sm text-white/65">
        Enter the email you signed up with and we&apos;ll send you a link to reset your password.
      </p>
      <Field label="Email" error={errors.email?.message} className="mb-5">
        <Input
          type="email"
          placeholder="you@example.com"
          className={INPUT_CLASS}
          {...register('email')}
        />
      </Field>

      <Button type="submit" variant="primary" loading={isLoading} className={SUBMIT_CLASS}>
        Send reset link
      </Button>

      <AuthFooter>
        Remembered it?{' '}
        <button type="button" onClick={onSwitchToLogin} className={FOOTER_ACTION_CLASS}>
          Back to log in
        </button>
      </AuthFooter>
    </form>
  )
}
