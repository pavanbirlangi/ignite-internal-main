// import { Sun } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import RegionToggle from './RegionToggle'
import SocialIcon, { hasSocialIcon } from '@/components/icons/SocialIcon'

import type { FooterData } from '@/lib/services/footer.service'
import type { FooterTranslations } from '@/lib/translations/footer'

export default function Footer({
  footerData,
  translations,
}: {
  footerData?: FooterData | null
  translations: FooterTranslations
}) {
  if (!footerData) return null

  return (
    <footer className="bg-secondary w-full pt-16 pb-28 font-sans md:pb-10">
      <div className="container [--max-width-container:1280px]">
        {/* Top Section */}
        <div className="mb-14 flex flex-col gap-10 lg:flex-row lg:justify-between lg:gap-16">
          {/* Left: Region, then the socials as a row of round buttons */}
          <div className="flex flex-col gap-8">
            {/* The currency pill uses the same grey as the footer, so it gets a lighter fill here. */}
            <div className="[&_.bg-secondary]:bg-white/5">
              <RegionToggle />
            </div>

            {!!footerData.social?.length && (
              <div className="flex flex-col gap-4">
                <span className="text-base font-bold text-white/95">
                  {translations.getInTheGame.replace(/:\s*$/, '')}
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  {footerData.social.map((socialItem) => (
                    <a
                      key={socialItem.name}
                      href={socialItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={socialItem.name}
                      className="grid size-10 place-items-center rounded-full bg-white/5 text-white/65 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {hasSocialIcon(socialItem.name) ? (
                        <SocialIcon name={socialItem.name} className="size-4" />
                      ) : (
                        // Networks without a matching glyph keep the CMS icon, muted.
                        <span
                          aria-hidden
                          className="flex size-[18px] grayscale [&_svg]:size-full"
                          dangerouslySetInnerHTML={{ __html: socialItem.logo }}
                        />
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Text link only: Trustpilot doesn't allow its logo outside
                their official widget. The URL comes from the CMS. */}
            {footerData.review_redirect_link && (
              <a
                href={footerData.review_redirect_link}
                target="_blank"
                rel="noopener noreferrer"
                className="group/tp flex w-max items-center gap-1.5 rounded-full bg-white/5 px-4 py-2.5 text-sm text-white/65 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="size-[15px] shrink-0 fill-(--trustpilot-green)"
                >
                  <path d="M12 2.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.7l7.1-.6z" />
                </svg>
                {translations.reviewsOn}{' '}
                <span className="font-medium text-(--trustpilot-green)">
                  Trustpilot
                </span>
                <ArrowUpRight
                  className="size-3.5 transition-transform group-hover/tp:translate-x-0.5 group-hover/tp:-translate-y-0.5"
                  strokeWidth={2}
                />
              </a>
            )}
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 lg:w-[60%] lg:gap-x-12">
            {footerData.links?.map((section) => (
              <div key={section.label} className="flex flex-col gap-4">
                <h3 className="text-base font-bold text-white/95">
                  {section.label}
                </h3>
                <ul className="flex flex-col gap-2">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.to}
                        className="text-sm text-white/65 transition-colors hover:text-white"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Bottom Divider */}
      <div className="h-px w-full bg-white/10" />

      <div className="container pt-6 [--max-width-container:1280px]">
        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Logo */}
          {footerData.logo && (
            <Image
              src={`${process.env.NEXT_PUBLIC_CMS_API_URL}/assets/${footerData.logo}`}
              alt="Increddy"
              width={150}
              height={20}
              className="h-4 sm:h-5  w-auto object-contain"
              quality={100}
              unoptimized
            />
          )}

          {/* Copyright */}
          <span className="text-white/65 text-sm font-medium">
            {footerData.bottom_text}
          </span>

          {/* Payment Methods */}
          {/* On phones each logo gets the same slot so differently shaped files line up. */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            {footerData.payment_images?.map((image) => (
              <Image
                key={image.directus_files_id}
                src={`${process.env.NEXT_PUBLIC_CMS_API_URL}/assets/${image.directus_files_id}`}
                alt="Payment method"
                width={60}
                height={20}
                className="h-5 w-12 object-contain sm:w-auto"
                quality={100}
                unoptimized
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
