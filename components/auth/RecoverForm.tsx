'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { INPUT_CLASS } from './shared'
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
      {/* Inputs */}
      <div className="mb-6 flex flex-col gap-3">
        <p className="text-muted-foreground mb-2 text-sm">
          Enter your registered email address to receive password reset
          instructions.
        </p>
        <div>
          <Input
            type="email"
            placeholder="Enter Mail"
            className={INPUT_CLASS}
            {...register('email')}
          />
          {errors.email && (
            <span className="text-red mt-1 block text-xs font-semibold">
              {errors.email.message}
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
          {isLoading ? 'Sending Request...' : 'Recover Password'}
        </button>
      </div>

      <button
        type="button"
        onClick={onSwitchToLogin}
        className="border-muted-foreground h-[48px] w-full cursor-pointer rounded-[6px] border-[0.78px] bg-transparent text-base font-semibold text-white transition-all hover:bg-white/5"
      >
        Back to Login
      </button>
    </form>
  )
}
