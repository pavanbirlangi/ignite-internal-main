import { Fragment } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { localizedHref } from '@/lib/utils'

export interface BreadcrumbItem {
  name: string
  // Without a path the item is the current page.
  path?: string
}

export default function GuidesBreadcrumb({ locale, items }: { locale: string; items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-white/50">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, i) => (
          <Fragment key={`${item.name}-${i}`}>
            {i > 0 ? (
              <li aria-hidden className="flex">
                <ChevronRight className="size-3.5 text-white/35" />
              </li>
            ) : null}
            <li>
              {item.path ? (
                <Link href={localizedHref(locale, item.path)} className="text-white/65 transition-colors hover:text-white">
                  {item.name}
                </Link>
              ) : (
                <span aria-current="page">{item.name}</span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}
