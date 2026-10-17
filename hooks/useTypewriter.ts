'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

const TYPE_MS = 110
const HOLD_MS = 1600
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

// Types each word after a fixed prefix, holds it, deletes it back to the
// prefix and types the next (timings measured on thetripxpert.com's search).
// Starts on the first word fully typed so server and client render the same
// text. Returns `fallback` for visitors who prefer reduced motion.
export function useTypewriter(
  prefix: string,
  words: string[],
  fallback: string,
) {
  const [text, setText] = useState(prefix + words[0])
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  )

  useEffect(() => {
    if (reduced) return
    let word = 0
    let length = words[0].length
    let deleting = true
    let timer: ReturnType<typeof setTimeout>

    const step = () => {
      if (deleting) {
        length--
        if (length === 0) {
          deleting = false
          word = (word + 1) % words.length
        }
      } else {
        length++
      }
      setText(prefix + words[word].slice(0, length))
      const typedOut = !deleting && length === words[word].length
      if (typedOut) deleting = true
      timer = setTimeout(step, typedOut ? HOLD_MS : TYPE_MS)
    }

    timer = setTimeout(step, HOLD_MS)
    return () => clearTimeout(timer)
  }, [prefix, words, reduced])

  return reduced ? fallback : text
}
