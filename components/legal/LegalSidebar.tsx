'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLegalPages } from '@/hooks/useLegalPage'

/** Convert a slug like "privacy-policy" to "Privacy Policy" */
function slugToLabel(slug: string): string {
    return slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
}

export default function LegalSidebar({
  translatedLabels,
}: {
  translatedLabels?: Record<string, string>
}) {
  const pathname = usePathname()
  const { data: response } = useLegalPages()
  const pages = response?.data ?? []

    // Extract current slug from the pathname (/en/privacy-policy → privacy-policy)
    const segments = pathname.split('/')
    const activeSlug = segments[segments.length - 1]

    // Get the locale from the pathname (/en/something -> en)
    const locale = segments[1]

    if (pages.length === 0) {
        return (
            <aside className="hidden lg:flex w-[396px] shrink-0 flex-col items-center self-start overflow-hidden rounded-[12px] bg-secondary/40 p-0">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex w-full items-center h-16 px-4 border-b border-secondary last:border-b-0 animate-pulse"
                    >
                        <div className="h-3 w-24 rounded bg-muted/20" />
                    </div>
                ))}
            </aside>
        )
    }

    return (
        <aside className="hidden lg:flex w-[396px] shrink-0 flex-col items-center self-start overflow-hidden rounded-[12px] bg-secondary/40 p-0">
            {pages.map((page, idx) => {
                const isActive = activeSlug === page.slug
                const isLast = idx === pages.length - 1
                return (
                    <Link
                        key={page.slug}
                        href={`/${locale}/legal/${page.slug}`}
                        className={`flex w-full items-center h-16 px-4 text-[16px] leading-[21px] no-underline transition-colors
              ${isActive
                                ? 'font-semibold text-foreground border-b-2 border-primary'
                                : `font-medium text-muted-foreground hover:text-foreground ${isLast ? '' : 'border-b border-secondary'}`
                            }
              ${isActive && isLast ? '' : ''}
            `}
                    >
                        {translatedLabels?.[page.slug] || slugToLabel(page.slug)}
                    </Link>
                )
            })}
        </aside>
    )
}
