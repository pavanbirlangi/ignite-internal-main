'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
// Radix's plain Action/Cancel: the shared wrappers add the site Button's large default size.
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui'
import { ACCOUNT_SECONDARY_BUTTON_CLASS } from '@/components/library/account-ui'
import { useUserStore } from '@/store/useUserStore'
import { Loader2, LogOut } from 'lucide-react'
import { cn, localizedHref } from '@/lib/utils'

interface LogoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogoutDialog({ open, onOpenChange }: LogoutDialogProps) {
  const logout = useUserStore((state) => state.logout)
  const router = useRouter()
  const { locale } = useParams<{ locale: string }>()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logout()
      router.replace(localizedHref(locale, '/'))
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoading(false)
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border w-[calc(100vw-2rem)] gap-0 rounded-2xl p-6 sm:max-w-105">
        <AlertDialogHeader className="flex flex-col place-items-start items-start gap-0 text-left">
          <span className="mb-4 grid size-12 place-items-center rounded-[14px] bg-[#F04452]/14 text-[#FF6B76]">
            <LogOut className="size-5.5" />
          </span>
          <AlertDialogTitle className="text-xl font-bold">Log out?</AlertDialogTitle>
          <AlertDialogDescription className="mt-1.5 text-sm text-white/65">
            You&apos;ll need to sign in again to see your library, orders and keys.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6 flex-col-reverse gap-2.5 sm:flex-row sm:justify-stretch">
          <AlertDialogPrimitive.Cancel
            disabled={isLoading}
            className={cn(ACCOUNT_SECONDARY_BUTTON_CLASS, 'mt-0 h-11 w-full sm:flex-1')}
          >
            Cancel
          </AlertDialogPrimitive.Cancel>
          <AlertDialogPrimitive.Action
            onClick={(e) => {
              e.preventDefault()
              handleLogout()
            }}
            disabled={isLoading}
            aria-busy={isLoading || undefined}
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#F04452]/30 bg-[#F04452]/14 px-4 text-sm font-medium text-[#FF6B76] transition-colors outline-none hover:bg-[#F04452]/22 focus-visible:ring-2 focus-visible:ring-[#FF6B76]/40 disabled:opacity-60 sm:flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Logging out...
              </>
            ) : (
              'Log out'
            )}
          </AlertDialogPrimitive.Action>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
