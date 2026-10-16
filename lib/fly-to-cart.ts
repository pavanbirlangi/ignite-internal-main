// Flies a product's cover art into the cart icon after it's added, then makes
// the cart hop. The icon to aim at is marked with data-cart-target (the
// header cart on desktop, the bottom-nav cart on phones).

const BUMP_KEYFRAMES: Keyframe[] = [
  { transform: 'translateY(0) rotate(0)' },
  { transform: 'translateY(-5px) rotate(-8deg)', offset: 0.3 },
  { transform: 'translateY(0) rotate(5deg)', offset: 0.6 },
  { transform: 'translateY(0) rotate(0)' },
]

let pendingFlights = 0

// While a flight is pending, the header cart skips its usual instant hop
// (it's keyed on the cart store's add counter) and hops when the cover lands.
export const isCartFlightPending = () => pendingFlights > 0

const findTarget = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>('[data-cart-target]'),
  ).find((el) => {
    const rect = el.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  })

const bump = (target: HTMLElement) =>
  target.animate(BUMP_KEYFRAMES, {
    duration: 600,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  })

// Call before starting the add, so the header doesn't hop early. Then call
// launch() with the cover image once the add succeeds, or cancel() if it fails.
export function prepareCartFlight() {
  pendingFlights += 1
  let settled = false
  const settle = () => {
    if (settled) return
    settled = true
    pendingFlights -= 1
  }

  return {
    cancel: settle,
    launch: async (image: HTMLImageElement | null) => {
      const target = findTarget()
      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      if (!target) return settle()
      if (!image || reduceMotion) {
        settle()
        bump(target)
        return
      }

      const from = image.getBoundingClientRect()
      const to = target.getBoundingClientRect()
      const width = from.width * 0.55
      const height = width * 1.3

      const flyer = document.createElement('img')
      flyer.src = image.currentSrc || image.src
      flyer.alt = ''
      flyer.setAttribute('aria-hidden', 'true')
      Object.assign(flyer.style, {
        position: 'fixed',
        zIndex: '100',
        pointerEvents: 'none',
        left: `${from.left + from.width / 2 - width / 2}px`,
        top: `${from.top + from.height / 2 - height / 2}px`,
        width: `${width}px`,
        height: `${height}px`,
        objectFit: 'cover',
        objectPosition: 'top',
        borderRadius: '10px',
        boxShadow: '0 14px 30px rgba(0, 0, 0, 0.6)',
      })
      document.body.appendChild(flyer)

      const dx = to.left + to.width / 2 - (from.left + from.width / 2)
      const dy = to.top + to.height / 2 - (from.top + from.height / 2)
      // Rises before dropping into the cart, more for longer trips.
      const lift = Math.min(160, Math.abs(dy) * 0.35 + 60)

      try {
        await flyer.animate(
          [
            { transform: 'translate(0, 0) scale(1) rotate(0)', opacity: 1 },
            {
              transform: `translate(${dx * 0.45}px, ${dy * 0.45 - lift}px) scale(0.55) rotate(-8deg)`,
              opacity: 1,
              offset: 0.45,
            },
            {
              transform: `translate(${dx}px, ${dy}px) scale(0.08) rotate(12deg)`,
              opacity: 0.6,
              borderRadius: '50%',
            },
          ],
          { duration: 820, easing: 'cubic-bezier(0.45, 0, 0.25, 1)' },
        ).finished
      } catch {
        // Animation cancelled (e.g. the page navigated); just clean up.
      } finally {
        flyer.remove()
        settle()
      }
      bump(target)
    },
  }
}
