import React from 'react'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { getWebPageJsonLd } from '@/lib/seo'

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; token: string }>
}) {
  const { locale, id, token } = await params
  const webPageJsonLd = getWebPageJsonLd({
    locale,
    pathname: 'account/reset',
    name: 'Reset Your Password | Increddy',
    description: 'Set a new password for your Increddy account.',
  })

  // Decoding the ID and token if they are URL-encoded
  const decodedId = decodeURIComponent(id)
  const decodedToken = decodeURIComponent(token)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageJsonLd),
        }}
      />
      <section className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-20">
        <div className="bg-secondary/40 border-secondary w-full max-w-lg overflow-hidden rounded-[30px] p-6 text-white shadow-2xl backdrop-blur-2xl sm:p-10">
          <div className="border-secondary mb-8 border-b pb-4">
            <h1 className="text-xl font-semibold tracking-wide text-white md:text-2xl">
              Reset Your Password
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Enter your new password below.
            </p>
          </div>
          <ResetPasswordForm id={decodedId} token={decodedToken} />
        </div>
      </section>
    </>
  )
}
