import { type ReactNode, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/use-translation'
import { NEARBY_RANGE_OPTIONS } from '@/hooks/use-product-filter'
import { ChevronDown } from 'lucide-react'

export type FilterType = 'all' | 'recent' | 'nearby' | 'trending'

interface FilterChipsProps {
  value: FilterType
  onChange: (filter: FilterType) => void
  /** Current nearby range in km */
  nearbyRange?: number
  /** Callback when range is changed via dropdown */
  onRangeChange?: (km: number) => void
  /** Compact mode for map overlay — smaller pills, no min-height */
  compact?: boolean
}

/**
 * Horizontal scrollable filter chips
 * Single-select (one active at a time)
 * - All: default sort by lastUpdated desc
 * - Recent: sort by createdAt desc
 * - Nearby: filter to products within configurable range
 * - Trending: sort by voteCount desc
 */
export function FilterChips({ value, onChange, nearbyRange, onRangeChange, compact = false }: FilterChipsProps) {
  const { t } = useTranslation()
  const [showRangeDropdown, setShowRangeDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!showRangeDropdown) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowRangeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showRangeDropdown])

  const filters: Array<{ value: FilterType; label: ReactNode }> = [
    { value: 'all', label: t('feed.all') },
    { value: 'recent', label: t('feed.recent') },
    { value: 'nearby', label: (
      <span className="inline-flex items-center gap-0.5">
        {t('feed.nearby')}
        {nearbyRange !== undefined && (
          <span className="text-[10px] opacity-75">{nearbyRange}km</span>
        )}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </span>
    )},
    { value: 'trending', label: t('feed.trending') },
  ]

  return (
    <div className={cn('flex flex-wrap gap-1.5 relative', compact ? '' : 'gap-1.5')}>
      {filters.map((filter) => (
        <div key={filter.value} className="relative" ref={filter.value === 'nearby' ? dropdownRef : undefined}>
          <motion.button
            onClick={() => {
              if (filter.value === 'nearby' && value === 'nearby') {
                // Toggle range dropdown when tapping active "nearby" chip
                setShowRangeDropdown(!showRangeDropdown)
              } else {
                setShowRangeDropdown(false)
                onChange(filter.value)
              }
            }}
            className={cn(
              'rounded-full font-medium whitespace-nowrap',
              compact
                ? 'px-3 py-1 text-xs'
                : 'px-3 py-1.5 text-sm min-h-[36px]',
              value === filter.value
                ? 'bg-primary text-primary-foreground'
                : compact
                  ? 'bg-background/80 text-muted-foreground border border-border/50 hover:bg-background'
                  : 'bg-muted text-muted-foreground border border-border hover:bg-card'
            )}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {filter.label}
          </motion.button>

          {/* Range dropdown for "nearby" chip */}
          {filter.value === 'nearby' && (
            <AnimatePresence>
              {showRangeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-1 left-0 z-50 bg-card border border-border rounded-xl shadow-lg p-1 min-w-[100px]"
                >
                  {NEARBY_RANGE_OPTIONS.map((km) => (
                    <button
                      key={km}
                      onClick={() => {
                        onRangeChange?.(km)
                        setShowRangeDropdown(false)
                        if (value !== 'nearby') onChange('nearby')
                      }}
                      className={cn(
                        'w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors',
                        nearbyRange === km
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-foreground hover:bg-muted'
                      )}
                    >
                      {km} km
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      ))}
    </div>
  )
}
