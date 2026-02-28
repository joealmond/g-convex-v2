import { useCallback, useRef, useState } from 'react'

/**
 * Manages open/close state for a collapsible section with scroll behavior.
 *
 * - On open: scrolls the container into view after animation completes.
 * - On close: scrolls up by the collapsed body height to keep below-content stable.
 *
 * Usage:
 *   const { open, containerRef, bodyRef, toggle, onAnimationComplete } = useCollapsible()
 */
export function useCollapsible(defaultOpen = false) {
  const [open, setOpen] = useState(defaultOpen)
  const containerRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const scrollActionRef = useRef<'open' | 'close' | null>(null)
  const collapsedHeightRef = useRef(0)

  const toggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) {
        scrollActionRef.current = 'open'
      } else {
        // Capture body height before the exit animation starts
        if (bodyRef.current) {
          collapsedHeightRef.current = bodyRef.current.offsetHeight
        }
        scrollActionRef.current = 'close'
      }
      return !prev
    })
  }, [])

  /** Pass to Framer Motion's onAnimationComplete */
  const onAnimationComplete = useCallback(() => {
    const action = scrollActionRef.current
    if (!action) return
    scrollActionRef.current = null

    if (action === 'open') {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (action === 'close') {
      const removed = collapsedHeightRef.current
      if (removed > 0) {
        // Cap scroll compensation at usable viewport (minus safe areas + bottom tabs ≈ 120px)
        const usable = window.innerHeight - 120
        window.scrollBy({ top: -Math.min(removed, usable), behavior: 'smooth' })
      }
    }
  }, [])

  return { open, containerRef, bodyRef, toggle, onAnimationComplete } as const
}
