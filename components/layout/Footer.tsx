// import { Sun } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import RegionToggle from './RegionToggle'

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
    <footer className="border-foreground bg-background w-full border-t pt-12 pb-28 font-sans md:pb-10">
      <div className="container [--max-width-container:1280px]">
        {/* Top Section */}
        <div className="mb-10 flex flex-col justify-between gap-10 lg:flex-row lg:gap-16">
          {/* Left: Region + Theme + Socials */}
          <div className="flex flex-col justify-between gap-8">
            {/* Region Selector + Theme Toggle */}
            <div className="flex items-center gap-3">
              <RegionToggle />
              {/* <button
                className="bg-secondary border-border text-foreground hover:bg-secondary/60 flex h-[56px] w-[56px] items-center justify-center rounded-full border transition-colors"
                aria-label="Toggle theme"
              >
                <Sun size={32} />
              </button> */}
            </div>

            {/* Social Icons */}
            <div className="flex flex-col gap-4">
              <span className="text-muted-foreground text-[16px] font-semibold">
                {translations.getInTheGame}
              </span>
              <div className="flex items-center gap-[18px]">
                {footerData.social?.map((socialItem) => (
                  <a
                    key={socialItem.name}
                    href={socialItem.url}
                    aria-label={socialItem.name}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-90"
                    dangerouslySetInnerHTML={{ __html: socialItem.logo }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Nav Columns */}
          <div className="flex flex-wrap gap-16">
            {footerData.links?.map((section) => (
              <div key={section.label} className="flex flex-col gap-4">
                <h3 className="text-muted-foreground text-[16px] leading-[150%] font-bold">
                  {section.label}
                </h3>
                <ul className="flex flex-col gap-2">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.to}
                        className="text-foreground hover:text-foreground/70 text-[14px] leading-[150%] transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Right: Review */}
          <div className="flex flex-col gap-4 py-1.5">
            <span className="text-foreground text-[14px] font-medium">
              {footerData.review_text || translations.checkoutReview}
            </span>
            {footerData.review_redirect_link ? (
              <a
                href={footerData.review_redirect_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={
                    footerData.review_image
                      ? `${process.env.NEXT_PUBLIC_CMS_API_URL}/assets/${footerData.review_image}`
                      : '/images/common/trustpilot.svg'
                  }
                  alt="Review"
                  width={120}
                  height={56}
                  className="h-14 w-auto object-contain"
                  quality={100}
                  unoptimized={!!footerData.review_image}
                />
              </a>
            ) : (
              <Image
                src={
                  footerData.review_image
                    ? `${process.env.NEXT_PUBLIC_CMS_API_URL}/assets/${footerData.review_image}`
                    : '/images/common/trustpilot.svg'
                }
                alt="Review"
                width={120}
                height={56}
                className="h-[56px] w-auto object-contain"
                quality={100}
                unoptimized={!!footerData.review_image}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Divider */}
      <div className="bg-muted-foreground h-px w-full" />

      <div className="container pt-5 [--max-width-container:1280px]">
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
          <span className="text-muted-foreground text-[14px] leading-[150%] font-medium">
            {footerData.bottom_text}
          </span>

          {/* Payment Methods */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-5">
            {footerData.payment_images?.map((image) => (
              <Image
                key={image.directus_files_id}
                src={`${process.env.NEXT_PUBLIC_CMS_API_URL}/assets/${image.directus_files_id}`}
                alt="Payment method"
                width={60}
                height={20}
                className="h-5 w-auto object-contain"
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
