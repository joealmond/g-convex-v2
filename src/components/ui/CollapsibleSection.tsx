import { type ReactNode, useCallback, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  title: string
  icon?: ReactNode
  /** Always-visible preview below the title (e.g. compact stat badges) */
  preview?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}

export function CollapsibleSection({
  title,
  icon,
  preview,
  defaultOpen = false,
  children,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const containerRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  // Track which scroll action to perform after animation: 'open' | 'close' | null
  const scrollActionRef = useRef<'open' | 'close' | null>(null)
  const collapsedHeightRef = useRef(0)

  const handleToggle = () => {
    setOpen((prev) => {
      if (!prev) {
        // Opening
        scrollActionRef.current = 'open'
      } else {
        // Closing — capture body height before animation starts
        if (bodyRef.current) {
          collapsedHeightRef.current = bodyRef.current.offsetHeight
        }
        scrollActionRef.current = 'close'
      }
      return !prev
    })
  }

  /** Called by Framer Motion when expand/collapse animation finishes */
  const handleAnimationComplete = useCallback(() => {
    const action = scrollActionRef.current
    if (!action) return
    scrollActionRef.current = null

    if (action === 'open') {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (action === 'close') {
      // The body shrank during the animation — scroll up to compensate
      // so the sections below don't appear to jump.
      // Cap at usable viewport height (minus ~120px for safe areas + bottom tabs).
      const removed = collapsedHeightRef.current
      if (removed > 0) {
        const usable = window.innerHeight - 120
        const amount = Math.min(removed, usable)
        window.scrollBy({ top: -amount, behavior: 'smooth' })
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn('border border-border rounded-2xl overflow-hidden', className)}
      style={{ scrollMarginTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
    >
      {/* Header — always visible, toggles open/closed */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
        onClick={handleToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-semibold text-sm text-foreground">{title}</span>
          </div>
          {preview && (
            <div className="mt-1 ml-7">{preview}</div>
          )}
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-2 flex-shrink-0"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            ref={bodyRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onAnimationComplete={handleAnimationComplete}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
