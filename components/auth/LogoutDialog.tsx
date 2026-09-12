'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { useUserStore } from '@/store/useUserStore'
import { Loader2 } from 'lucide-react' // Optional: for loading spinner
import { cn } from '@/lib/utils'

interface LogoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogoutDialog({ open, onOpenChange }: LogoutDialogProps) {
  const logout = useUserStore((state) => state.logout)
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)

  const getLocaleHomePath = () => {
    const segments = pathname.split('/').filter(Boolean)
    const locale = segments[0]
    return locale ? `/${locale}` : '/'
  }

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logout()
      router.replace(getLocaleHomePath())
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
      <AlertDialogContent className="max-w-[90vw] gap-6 rounded-2xl p-6 sm:max-w-md">
        <AlertDialogHeader className="space-y-3">
          <AlertDialogTitle className="text-[17px] font-bold sm:text-2xl">
            Confirm Logout
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed sm:text-base">
            Are you sure you want to log out? You'll need your credentials to
            access your profile and library again.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col-reverse gap-3 sm:flex-row">
          <AlertDialogCancel
            disabled={isLoading}
            className="mt-0 w-full focus:ring-0 focus:outline-none sm:flex-1"
          >
            Stay Logged In
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleLogout()
            }}
            disabled={isLoading}
            className={cn('bg-red w-full sm:flex-1')}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging out...
              </>
            ) : (
              'Logout'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
