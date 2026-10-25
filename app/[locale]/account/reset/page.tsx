import React from 'react'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { getWebPageJsonLd } from '@/lib/seo'

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string; set?: string }>
}) {
  const { locale } = await params
  const { token, set } = await searchParams
  // R-94: "set a password" emails add &set=1 (the customer had no password yet).
  const setup = set === '1'
  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: 'account/reset',
    name: 'Reset Your Password | Increddy',
    description: 'Set a new password for your Increddy account.',
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageJsonLd),
        }}
      />
      <section className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-20">
        {/* Same card as the sign-in modal. */}
        <div className="bg-card border-border w-full max-w-105 overflow-hidden rounded-2xl border p-6 text-white/95 shadow-2xl sm:p-7">
          <div className="mb-5">
            <h1 data-display className="text-xl font-bold text-white/95">
              {setup ? 'Set a password' : 'Reset your password'}
            </h1>
            <p className="mt-1 text-sm text-white/65">
              {setup
                ? 'Choose a password to also sign in with your email, alongside Google or an email code'
                : 'Choose a new password for your account'}
            </p>
          </div>
          {token ? (
            <ResetPasswordForm token={decodeURIComponent(token)} setup={setup} />
          ) : (
            <p className="text-red text-sm">
              This link is missing its token. Please request a new password
              reset email.
            </p>
          )}
        </div>
      </section>
    </>
  )
}
