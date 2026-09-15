// import { Sun } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import RegionToggle from './RegionToggle'

import type { FooterData } from '@/lib/services/footer.service'
import type { FooterTranslations } from '@/lib/translations/footer'

export default function FooterV2({
  footerData,
  translations,
}: {
  footerData?: FooterData | null
  translations: FooterTranslations
}) {
  if (!footerData) return null

  return (
    <footer className="bg-background w-full font-sans max-md:pb-24">
      <div className="container [--max-width-container:1280px]">
        <div className="flex items-center justify-center gap-6 py-7 lg:justify-end">
          {footerData.payment_images?.map((image) => (
            <Image
              key={image.directus_files_id}
              src={`${process.env.NEXT_PUBLIC_CMS_API_URL}/assets/${image.directus_files_id}`}
              alt={`Payment Method ${image.directus_files_id}`}
              width={60}
              height={20}
              className="h-5 w-auto object-contain"
              quality={100}
              unoptimized
            />
          ))}
        </div>
      </div>

      <div className="bg-muted-foreground h-px w-full" />

      <div className="container [--max-width-container:1280px]">
        <div className="grid gap-10 py-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1.2fr] lg:gap-12">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-muted-foreground text-[16px] leading-[150%] font-bold">
                {translations.locationTitle}
              </h3>
              {footerData.location && (
                <div
                  className="text-foreground prose-p:m-0! prose-p:p-0! space-y-1 text-[14px] leading-[150%]"
                  dangerouslySetInnerHTML={{ __html: footerData.location }}
                />
              )}
            </div>

            <div className="flex flex-col gap-4">
              <span className="text-muted-foreground text-[16px] leading-[150%] font-bold">
                {translations.getInTheGame}
              </span>
              <div className="flex items-center">
                {footerData.social?.map((socialItem) => (
                  <a
                    key={socialItem.name}
                    href={socialItem.url}
                    aria-label={socialItem.name}
                    className="flex h-12 w-12 items-center justify-center rounded-full transition-opacity hover:opacity-90"
                    dangerouslySetInnerHTML={{ __html: socialItem.logo }}
                  />
                ))}
              </div>
            </div>
          </div>

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

          {/* Only shown once a real review is configured in the CMS --
              previously fell back to hardcoded placeholder text and a
              generic Trustpilot image whenever that field was empty, so
              clearing it in the CMS had no visible effect. */}
          {footerData.review_text && (
            <div className="flex flex-col gap-4 py-1.5 lg:items-start">
              <span className="text-foreground text-[14px] leading-[150%] font-medium">
                {footerData.review_text}
              </span>
              {footerData.review_redirect_link ? (
                <a
                  href={footerData.review_redirect_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    src={`${process.env.NEXT_PUBLIC_CMS_API_URL}/assets/${footerData.review_image}`}
                    alt="Review"
                    width={175}
                    height={88}
                    className="h-18 w-auto object-contain"
                    quality={100}
                    unoptimized
                  />
                </a>
              ) : (
                footerData.review_image && (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_CMS_API_URL}/assets/${footerData.review_image}`}
                    alt="Review"
                    width={175}
                    height={88}
                    className="h-18 w-auto object-contain"
                    quality={100}
                    unoptimized
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-muted-foreground h-px w-full" />

      <div className="container [--max-width-container:1280px]">
        <div className="flex flex-col items-center justify-between gap-5 py-10 pb-12 lg:flex-row">
          {footerData.logo && (
            <Image
              src={`${process.env.NEXT_PUBLIC_CMS_API_URL}/assets/${footerData.logo}`}
              alt="Increddy"
              width={220}
              height={38}
              className="h-5 w-auto object-contain"
              quality={100}
              unoptimized
            />
          )}

          <span className="text-muted-foreground text-[14px] leading-[150%] font-medium">
            {footerData.bottom_text}
          </span>

          <div className="flex items-center gap-3">
            <RegionToggle />
            {/* <button
              className="bg-secondary border-border text-foreground hover:bg-secondary/60 flex h-14 w-14 items-center justify-center rounded-full border transition-colors"
              aria-label="Toggle theme"
            >
              <Sun size={32} />
            </button> */}
          </div>
        </div>
      </div>
    </footer>
  )
}
