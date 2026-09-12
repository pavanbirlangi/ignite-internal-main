// app/library/layout.tsx
import { Sidebar } from '@/components/library/Sidebar'
import { MobileSidebar } from '@/components/library/MobileSidebar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | Increddy',
  description: 'Manage your orders, library, and account settings.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-background border-muted-foreground/40 mt-2 flex min-h-screen flex-col border-t md:mt-6">
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col max-lg:px-4 md:gap-8 lg:flex-row lg:items-stretch">
        <MobileSidebar />
        <Sidebar />
        <main className="min-w-0 flex-1 py-4 !pb-20 md:py-10">{children}</main>
      </div>
    </div>
  )
}
