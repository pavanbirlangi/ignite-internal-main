// Epic Games Store typography preview, part 2 (see TypographySwitcher and the
// html[data-typography='epic'] block in globals.css).
//
// globals.css maps our key elements (cards, nav, FAQ...) to Epic's exact
// styles. Everything else, on every page, is snapped here to the nearest step
// of Epic's type scale (measured on store.epicgames.com) and to its three
// weights. Values are set inline, so the !important role rules in globals.css
// still win where they apply.

const SCALE = [
  { below: 13, size: 12, lineHeight: '15.6px', letterSpacing: '0.36px' },
  { below: 15, size: 14, lineHeight: '19.6px', letterSpacing: '0.28px' },
  { below: 18, size: 16, lineHeight: '24px', letterSpacing: '0.16px' },
  { below: 22, size: 20, lineHeight: '24px', letterSpacing: '-0.3px' },
  { below: 28, size: 24, lineHeight: 'normal', letterSpacing: 'normal' },
  { below: Infinity, size: 32, lineHeight: 'normal', letterSpacing: 'normal' },
]

const PROPS = ['font-size', 'line-height', 'letter-spacing', 'font-weight']
const SKIP = 'svg, script, style, [data-typography-switcher]'

// Original inline values, so switching back restores the page exactly.
const original = new Map<HTMLElement, string[]>()

const hasOwnText = (el: Element) =>
  el.matches('input, textarea, select') ||
  Array.from(el.childNodes).some(
    (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim(),
  )

// Epic uses 400, 500 and 700 only.
const snapWeight = (weight: number) =>
  weight <= 450 ? '400' : weight <= 550 ? '500' : '700'

function snap(el: HTMLElement) {
  if (original.has(el) || el.closest(SKIP) || !hasOwnText(el)) return
  const style = getComputedStyle(el)
  const step = SCALE.find((s) => parseFloat(style.fontSize) < s.below)!
  original.set(
    el,
    PROPS.map((p) => el.style.getPropertyValue(p)),
  )
  el.style.setProperty('font-size', `${step.size}px`)
  el.style.setProperty('line-height', step.lineHeight)
  el.style.setProperty('letter-spacing', step.letterSpacing)
  el.style.setProperty('font-weight', snapWeight(Number(style.fontWeight)))
}

function snapTree(root: Element) {
  if (root instanceof HTMLElement) snap(root)
  root.querySelectorAll<HTMLElement>('*').forEach(snap)
}

function restoreAll() {
  original.forEach((values, el) =>
    PROPS.forEach((p, i) =>
      values[i]
        ? el.style.setProperty(p, values[i])
        : el.style.removeProperty(p),
    ),
  )
  original.clear()
}

// Starts snapping the page (and anything rendered later). Returns a function
// that stops and restores every element.
export function startEpicTypography() {
  let frame = 0
  const pending = new Set<Element>()
  const flush = () => {
    frame = 0
    pending.forEach((node) => node.isConnected && snapTree(node))
    pending.clear()
  }
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList')
        m.addedNodes.forEach(
          (n) => n instanceof Element && pending.add(n),
        )
      else if (m.target.parentElement) pending.add(m.target.parentElement)
    }
    if (!frame) frame = requestAnimationFrame(flush)
  })
  // Breakpoints change the original sizes, so re-snap from scratch on resize.
  let resizeTimer: ReturnType<typeof setTimeout>
  const onResize = () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      restoreAll()
      snapTree(document.body)
    }, 200)
  }

  snapTree(document.body)
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  })
  window.addEventListener('resize', onResize)

  return () => {
    observer.disconnect()
    window.removeEventListener('resize', onResize)
    clearTimeout(resizeTimer)
    cancelAnimationFrame(frame)
    restoreAll()
  }
}
