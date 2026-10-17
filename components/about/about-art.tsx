'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { AboutCover } from '@/lib/services/about-covers'
import styles from './about.module.css'

// A resized copy from Next's image optimiser (the originals are full-size uploads).
function optimizedImage(src: string) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=640&q=75`
}

// Text filled with a row of product covers that slowly pans inside the letters.
export function CoverFill({
  covers,
  size = 420,
  children,
}: {
  covers: AboutCover[]
  size?: number
  children: ReactNode
}) {
  if (covers.length === 0) return <span className="text-primary">{children}</span>
  const style = {
    '--strip': covers.map((c) => `url('${optimizedImage(c.image)}')`).join(','),
    '--pos': covers.map((_, i) => `${i * size}px 46%`).join(','),
    '--pos2': covers.map((_, i) => `${i * size - size * 2}px 54%`).join(','),
    '--size': `${size}px`,
  } as CSSProperties
  return (
    <span className={styles.fill} style={style}>
      {children}
    </span>
  )
}

// Splits a heading around a phrase so the phrase can be filled with covers; null when it's absent.
export function splitAround(text: string, phrase: string) {
  const at = text.toLowerCase().indexOf(phrase.toLowerCase())
  if (at === -1) return null
  return [text.slice(0, at), text.slice(at, at + phrase.length), text.slice(at + phrase.length)] as const
}

// Tilts the element under the pointer (--rx/--ry) and moves its glare and glow (--gx, --mx, --my).
// One style write per frame; nothing runs while the pointer is elsewhere.
export function useTilt<T extends HTMLElement>(strength = 1) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const target = (el.querySelector('[data-tilt]') as HTMLElement | null) ?? el
    let frame = 0
    const move = (event: PointerEvent) => {
      const box = el.getBoundingClientRect()
      const x = (event.clientX - box.left) / box.width - 0.5
      const y = (event.clientY - box.top) / box.height - 0.5
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        target.style.setProperty('--rx', (x * 16 * strength).toFixed(2))
        target.style.setProperty('--ry', (-y * 12 * strength).toFixed(2))
        target.style.setProperty('--gx', (x * 120).toFixed(1))
        target.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`)
        target.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(1)}%`)
      })
    }
    const leave = () => {
      cancelAnimationFrame(frame)
      target.style.setProperty('--rx', '0')
      target.style.setProperty('--ry', '0')
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [strength])
  return ref
}

// Five covers fanned in 3D; tilts with the pointer and opens wider on hover.
export function CoverFan({ covers, className }: { covers: AboutCover[]; className?: string }) {
  const ref = useTilt<HTMLDivElement>()
  if (covers.length < 5) return null
  return (
    <div ref={ref} className={cn(styles.fanStage, className)} aria-hidden="true">
      <div className={styles.fan} data-tilt>
        {covers.slice(0, 5).map((cover) => (
          <div key={cover.handle} className={styles.cover}>
            <Image src={cover.image} alt="" fill sizes="230px" priority />
          </div>
        ))}
      </div>
    </div>
  )
}
