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
    <div className="bg-background flex min-h-screen flex-col">
      {/* Same container as the header, so the menu and content line up with the logo and icons. */}
      <div className="container flex flex-1 flex-col gap-4 pt-4 [--max-width-container:1240px] md:pt-8 lg:flex-row lg:items-start lg:gap-10">
        <MobileSidebar />
        <Sidebar />
        <main className="min-w-0 flex-1 pb-24">{children}</main>
      </div>
    </div>
  )
}
