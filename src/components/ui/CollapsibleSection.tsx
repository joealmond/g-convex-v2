import { type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useCollapsible } from '@/hooks/use-collapsible'

const ANIMATION = { duration: 0.2 } as const

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
  const { open, containerRef, bodyRef, toggle, onAnimationComplete } =
    useCollapsible(defaultOpen)

  return (
    <div
      ref={containerRef}
      className={cn('border border-border rounded-2xl overflow-hidden', className)}
      style={{ scrollMarginTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
    >
      {/* Header — always visible */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
        onClick={toggle}
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-semibold text-sm text-foreground">{title}</span>
          </div>
          {preview && <div className="mt-1 ml-7">{preview}</div>}
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={ANIMATION}
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
            transition={ANIMATION}
            onAnimationComplete={onAnimationComplete}
            className="overflow-hidden"
          >
            <div className="border-t border-border">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
