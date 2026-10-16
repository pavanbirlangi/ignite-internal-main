'use client'

import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NavItem } from './nav-item'

export interface PlatformNavItem {
  name: string
  href: string
  icon: ReactNode
}

// The current page is a platform's store listing when it's /store (any locale) and every query
// param of that platform's link matches, e.g. /store?platform=xbox. Case-insensitive because the
// CMS links use values like "Pc" and "Nintendo eShop".
function isCurrentPlatform(
  href: string,
  pathname: string | null,
  searchParams: URLSearchParams | null,
) {
  if (!pathname || !searchParams) return false
  const [path, query = ''] = href.split('?')
  if (!pathname.replace(/\/$/, '').endsWith(path.replace(/\/$/, '')))
    return false
  const wanted = new URLSearchParams(query)
  if ([...wanted.keys()].length === 0) return false
  return [...wanted.entries()].every(
    ([key, value]) =>
      searchParams.get(key)?.toLowerCase() === value.toLowerCase(),
  )
}

const STEP_ASIDE_EASE = 'cubic-bezier(0.22,1,0.36,1)'
const stepAsideTransition = (durationMs: number, delayMs: number) =>
  [
    'color 200ms ease-out',
    'scale 200ms ease-out',
    ...['translate', 'opacity', 'filter'].map(
      (property) =>
        `${property} ${durationMs}ms ${STEP_ASIDE_EASE} ${delayMs}ms`,
    ),
  ].join(', ')

function PlatformNavItems({
  items,
  currentIndex,
  hidden,
}: {
  items: PlatformNavItem[]
  currentIndex: number
  hidden: boolean
}) {
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const capsuleRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  // Off while the capsule appears from nothing, so it fades in on the item instead of sliding in
  // from wherever it last was; on while it moves between items.
  const [sliding, setSliding] = useState(false)

  const targetIndex = hidden
    ? null
    : (hoveredIndex ?? (currentIndex >= 0 ? currentIndex : null))
  const visible = targetIndex !== null

  // Moves the capsule onto an item. Written straight to the element's style (no re-render), so the
  // CSS transition does the gliding.
  const place = useCallback((index: number) => {
    const el = itemRefs.current[index]
    const capsule = capsuleRef.current
    if (!el || !capsule) return
    capsule.style.left = `${el.offsetLeft}px`
    capsule.style.width = `${el.offsetWidth}px`
  }, [])

  const highlight = (index: number) => {
    if (!visible) {
      // Place it under the item without animating, then let later moves slide.
      setSliding(false)
      place(index)
      requestAnimationFrame(() => setSliding(true))
    }
    setHoveredIndex(index)
  }

  // Follows the target: the change of left/width is what the CSS transition animates.
  const targetRef = useRef<number | null>(null)
  useLayoutEffect(() => {
    targetRef.current = targetIndex
    if (targetIndex !== null) place(targetIndex)
  }, [targetIndex, place, items.length])

  // Item widths change when the web font loads or the window is resized (the pill may even have
  // been hidden and shown again), so re-place the capsule then, jumping instead of gliding.
  useEffect(() => {
    const resync = () => {
      const capsule = capsuleRef.current
      if (!capsule || targetRef.current === null) return
      capsule.style.transition = 'none'
      place(targetRef.current)
      void capsule.offsetWidth
      capsule.style.transition = ''
    }
    window.addEventListener('resize', resync)
    document.fonts?.ready.then(resync)
    return () => window.removeEventListener('resize', resync)
  }, [place])

  // The current platform's capsule is in place on first paint, not animated in.
  useEffect(() => {
    const id = requestAnimationFrame(() => setSliding(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const hovering = hoveredIndex !== null

  return (
    <div
      className="relative flex items-center gap-2"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {/* Gliding capsule: slides between items with a slight spring, brighter while hovering,
          blue-tinted when it rests on the current platform. */}
      <div
        ref={capsuleRef}
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 rounded-full',
          'ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none',
          sliding
            ? 'transition-[left,width,opacity,transform,background-color,box-shadow] duration-[450ms]'
            : 'transition-[opacity,transform] duration-200',
          visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0',
          hovering
            ? 'bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),0_8px_28px_-8px_rgba(36,104,223,0.7)]'
            : 'bg-primary/15 shadow-[inset_0_0_0_1px_rgba(36,104,223,0.45),0_0_22px_-6px_rgba(36,104,223,0.6)]',
        )}
      >
        {/* Light edge along the bottom of the capsule */}
        <span
          className={cn(
            'via-primary absolute inset-x-5 -bottom-px h-px rounded-full bg-linear-to-r from-transparent to-transparent transition-opacity duration-300',
            hovering ? 'opacity-100' : 'opacity-60',
          )}
        />
      </div>

      {items.map((item, index) => (
        <NavItem
          key={item.name}
          href={item.href}
          tabIndex={hidden ? -1 : undefined}
          aria-hidden={hidden || undefined}
          // While the search bar is open the items step aside: out right-to-left as the bar grows
          // from the right, back left-to-right once it has shrunk.
          // Only the step-aside is staggered; hover colour and press stay instant.
          className={cn(
            'motion-reduce:transition-none!',
            hidden && 'pointer-events-none -translate-x-3 opacity-0 blur-[2px]',
          )}
          style={{
            // Out fast (the bar is coming), back in gently after it has shrunk.
            transition: hidden
              ? stepAsideTransition(180, (items.length - 1 - index) * 25)
              : stepAsideTransition(320, 220 + index * 50),
          }}
          ref={(el) => {
            itemRefs.current[index] = el
          }}
          highlighted={targetIndex === index}
          current={currentIndex === index}
          onMouseEnter={() => !hidden && highlight(index)}
          onFocus={() => highlight(index)}
          onBlur={() => setHoveredIndex(null)}
        >
          {item.icon}
          {/* Trimmed to cap height, then 1px up so mixed-case labels sit on the icon's optical
              centre. Browsers without text-box trimming already sit about that high. */}
          <span className="trim leading-none font-medium supports-[text-box:trim-both_cap_alphabetic]:-translate-y-px">
            {item.name}
          </span>
        </NavItem>
      ))}
    </div>
  )
}

type PlatformNavProps = {
  items: PlatformNavItem[]
  // The search bar is open over the items.
  hidden?: boolean
}

function PlatformNavWithCurrent({ items, hidden = false }: PlatformNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentIndex = items.findIndex((item) =>
    isCurrentPlatform(item.href, pathname, searchParams),
  )
  return (
    <PlatformNavItems
      items={items}
      currentIndex={currentIndex}
      hidden={hidden}
    />
  )
}

// useSearchParams needs a Suspense boundary on statically rendered pages; until it resolves the
// items render without a current platform.
export function PlatformNav({ items, hidden = false }: PlatformNavProps) {
  return (
    <Suspense
      fallback={
        <PlatformNavItems items={items} currentIndex={-1} hidden={hidden} />
      }
    >
      <PlatformNavWithCurrent items={items} hidden={hidden} />
    </Suspense>
  )
}
