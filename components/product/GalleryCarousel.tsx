'use client'

import { getImageProps } from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getProxyImageUrl } from '@/lib/utils'

interface GalleryCarouselProps {
  images: string[]
  // Alt text per image (same order); falls back to "Gallery preview N".
  alts?: string[]
  activeIndex: number | null
  onClose: () => void
  onChangeIndex: (index: number) => void
}

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
// How far a swipe must travel (share of the width), or how fast, to move to the next screenshot.
const SWIPE_SHARE = 0.18
const SWIPE_VELOCITY = 0.45
// Dragging down this far closes the viewer.
const CLOSE_DRAG = 110

const GLASS_BUTTON =
  'grid size-11 cursor-pointer place-items-center rounded-full border border-white/15 bg-white/8 text-white backdrop-blur-md transition-[background-color,transform,opacity] duration-200 hover:bg-white/16 active:scale-[0.93] disabled:pointer-events-none disabled:opacity-25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

// Optimized URLs from the site's image loader (resized, WebP), for a plain <img>.
const imageProps = (url: string, width: number, height: number, sizes: string, alt: string) =>
  getImageProps({ src: getProxyImageUrl(url), alt, width, height, sizes }).props

// Full-screen screenshot viewer: screenshots slide and follow the finger, swipe down (or Esc, or a
// tap beside the image) closes, arrows and thumbnails on larger screens. Rendered on <body> so it
// sits above the header, the mobile nav and the buy bar.
export default function GalleryCarousel({
  images,
  alts,
  activeIndex,
  onClose,
  onChangeIndex,
}: GalleryCarouselProps) {
  const isOpen = activeIndex !== null && Boolean(images[activeIndex])
  const [rendered, setRendered] = useState(false)
  const [entered, setEntered] = useState(false)
  const [index, setIndex] = useState(0)
  const stripRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([])
  const openerRef = useRef<Element | null>(null)
  const count = images.length

  // Mount, then fade in on the next frame; on close fade out, then unmount.
  useEffect(() => {
    if (isOpen) {
      openerRef.current = document.activeElement
      setRendered(true)
      const frame = requestAnimationFrame(() => setEntered(true))
      return () => cancelAnimationFrame(frame)
    }
    setEntered(false)
    const timer = setTimeout(() => setRendered(false), 300)
    return () => clearTimeout(timer)
  }, [isOpen])

  useEffect(() => {
    if (activeIndex !== null) setIndex(activeIndex)
  }, [activeIndex])

  const place = useCallback(
    (dx = 0, dy = 0, animate = true) => {
      const strip = stripRef.current
      if (!strip) return
      strip.style.transition = animate ? `transform 450ms ${EASE}` : 'none'
      strip.style.transform = `translate3d(calc(${-index * 100}% + ${dx}px), ${dy}px, 0)`
    },
    [index],
  )

  // Slide to the current screenshot (no animation when the viewer opens) and keep its thumbnail in view.
  const wasEntered = useRef(false)
  useEffect(() => {
    if (!rendered) return
    place(0, 0, wasEntered.current)
    wasEntered.current = entered
    thumbRefs.current[index]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: entered ? 'smooth' : 'auto' })
  }, [index, rendered, entered, place])

  // Page scroll stays put underneath; focus moves into the viewer and back to the screenshot after.
  useEffect(() => {
    if (!rendered) return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    closeRef.current?.focus({ preventScroll: true })
    return () => {
      root.style.overflow = previous
      ;(openerRef.current as HTMLElement | null)?.focus?.({ preventScroll: true })
    }
  }, [rendered])

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(count - 1, next))
      if (clamped === index) place()
      else onChangeIndex(clamped)
    },
    [count, index, onChangeIndex, place],
  )

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowRight') go(index + 1)
      else if (event.key === 'ArrowLeft') go(index - 1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, index, go, onClose])

  // Swipe: horizontal drags move between screenshots (with resistance past the ends), a downward
  // drag closes, a tap beside the image closes.
  const gesture = useRef({ x: 0, y: 0, t: 0, dx: 0, dy: 0, mode: null as 'x' | 'y' | 'none' | null })
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    gesture.current = { x: event.clientX, y: event.clientY, t: performance.now(), dx: 0, dy: 0, mode: null }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const g = gesture.current
    g.dx = event.clientX - g.x
    g.dy = event.clientY - g.y
    if (!g.mode && Math.hypot(g.dx, g.dy) > 6) {
      g.mode = Math.abs(g.dx) > Math.abs(g.dy) ? 'x' : g.dy > 0 ? 'y' : 'none'
    }
    if (g.mode === 'x') {
      const pastEnd = (index === 0 && g.dx > 0) || (index === count - 1 && g.dx < 0)
      place(pastEnd ? g.dx * 0.3 : g.dx, 0, false)
    } else if (g.mode === 'y') {
      place(0, Math.max(0, g.dy), false)
      if (backdropRef.current) backdropRef.current.style.opacity = String(Math.max(0.35, 1 - g.dy / 400))
    }
  }
  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    const g = gesture.current
    const width = stageRef.current?.clientWidth ?? 1
    const velocity = g.dx / Math.max(1, performance.now() - g.t)
    if (g.mode === 'x') {
      if (g.dx < -width * SWIPE_SHARE || velocity < -SWIPE_VELOCITY) go(index + 1)
      else if (g.dx > width * SWIPE_SHARE || velocity > SWIPE_VELOCITY) go(index - 1)
      else place()
    } else if (g.mode === 'y') {
      if (g.dy > CLOSE_DRAG) onClose()
      else {
        place()
        if (backdropRef.current) backdropRef.current.style.opacity = ''
      }
    } else if (!g.mode && (event.target as HTMLElement).dataset.slide !== undefined) {
      onClose()
    }
    g.mode = null
  }

  if (!rendered || !count) return null

  const altFor = (i: number) => alts?.[i] ?? `Gallery preview ${i + 1}`
  const ambient = imageProps(images[index], 256, 144, '256px', '').src

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Screenshots"
      className="fixed inset-0 z-[200] flex flex-col transition-opacity duration-300 motion-reduce:transition-none"
      style={{ opacity: entered ? 1 : 0, transitionTimingFunction: EASE }}
    >
      <div ref={backdropRef} className="absolute inset-0 overflow-hidden bg-[#09090A]">
        {/* A soft glow of the current screenshot's colours. */}
        <div
          aria-hidden
          className="absolute -inset-[10%] bg-cover bg-center opacity-30 blur-[60px] saturate-[1.3] transition-[background-image] duration-500"
          style={{ backgroundImage: `url("${ambient}")` }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-between px-4 pt-[calc(14px+env(safe-area-inset-top,0px))] pb-2 md:px-6">
        <p className="text-sm font-semibold tracking-wide text-white/85 tabular-nums">
          {index + 1} <span className="text-white/45">/ {count}</span>
        </p>
        <button ref={closeRef} type="button" aria-label="Close gallery" onClick={onClose} className={GLASS_BUTTON}>
          <X className="size-5" />
        </button>
      </div>

      <div
        ref={stageRef}
        className="relative min-h-0 flex-1 touch-none overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <div ref={stripRef} className="flex h-full will-change-transform">
          {images.map((url, i) => (
            <div key={`${url}-${i}`} data-slide="" className="grid h-full w-full shrink-0 place-items-center px-4 py-2 md:px-24">
              {/* The current screenshot and its neighbours load; the rest wait until they're near. */}
              {Math.abs(i - index) <= 1 && (
                <img
                  {...imageProps(url, 1920, 1080, '100vw', altFor(i))}
                  draggable={false}
                  className="h-auto max-h-full w-auto max-w-full rounded-[10px] shadow-[0_30px_80px_rgba(0,0,0,0.55)] select-none transition-[transform,opacity] duration-500 motion-reduce:transition-none"
                  style={{
                    transform: entered ? 'scale(1)' : 'scale(0.97)',
                    opacity: entered ? 1 : 0,
                    transitionTimingFunction: EASE,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              className={`${GLASS_BUTTON} absolute top-1/2 left-5 z-10 hidden size-13 -translate-y-1/2 md:grid`}
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(index + 1)}
              disabled={index === count - 1}
              className={`${GLASS_BUTTON} absolute top-1/2 right-5 z-10 hidden size-13 -translate-y-1/2 md:grid`}
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="relative z-10 flex [justify-content:safe_center] gap-2.5 overflow-x-auto px-4 pt-3 pb-[calc(18px+env(safe-area-inset-bottom,0px))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((url, i) => (
            <button
              key={`${url}-${i}`}
              ref={(node) => {
                thumbRefs.current[i] = node
              }}
              type="button"
              aria-label={`Screenshot ${i + 1}`}
              aria-current={i === index}
              onClick={() => go(i)}
              className={`aspect-video w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg outline-2 outline-offset-2 transition-[opacity,outline-color] duration-300 md:w-21 ${
                i === index ? 'opacity-100 outline-primary' : 'opacity-45 outline-transparent hover:opacity-80'
              }`}
            >
              <img {...imageProps(url, 256, 144, '84px', '')} className="size-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  )
}
