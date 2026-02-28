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
  const shouldScrollRef = useRef(false)

  const handleToggle = () => {
    setOpen((prev) => {
      if (!prev) shouldScrollRef.current = true
      return !prev
    })
  }

  /** Called by Framer Motion when the expand animation finishes */
  const handleAnimationComplete = useCallback(() => {
    if (shouldScrollRef.current) {
      shouldScrollRef.current = false
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return (
    <div ref={containerRef} className={cn('border border-border rounded-2xl overflow-hidden scroll-mt-3', className)}>
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
