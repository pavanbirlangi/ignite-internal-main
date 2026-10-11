import React from 'react'
import type { Metadata } from 'next'
import { MagicLinkSignIn } from '@/components/auth/MagicLinkSignIn'

// A one-time sign-in link page: nothing here for search engines.
export const metadata: Metadata = {
  title: 'Signing In | Increddy',
  robots: { index: false, follow: false },
}

export default async function MagicLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <section className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-20">
      <div className="bg-secondary/40 border-secondary w-full max-w-lg overflow-hidden rounded-[30px] p-6 text-white shadow-2xl backdrop-blur-2xl sm:p-10">
        <div className="border-secondary mb-8 border-b pb-4">
          <h1 className="text-xl font-semibold tracking-wide text-white md:text-2xl">
            Sign In to Increddy
          </h1>
        </div>
        {token ? (
          <MagicLinkSignIn token={token} />
        ) : (
          <p className="text-red text-sm font-semibold">
            This sign-in link is missing its token. Please request a new code.
          </p>
        )}
      </div>
    </section>
  )
}
