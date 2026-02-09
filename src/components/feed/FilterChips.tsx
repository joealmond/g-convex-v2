'use client'

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type FilterType = 'all' | 'recent' | 'nearby' | 'trending'

interface FilterChipsProps {
  value: FilterType
  onChange: (filter: FilterType) => void
  /** Compact mode for map overlay — smaller pills, no min-height */
  compact?: boolean
}

/**
 * Horizontal scrollable filter chips
 * Single-select (one active at a time)
 * - All: default sort by lastUpdated desc
 * - Recent: sort by createdAt desc
 * - Nearby: filter to products within 5km
 * - Trending: sort by voteCount desc
 */
export function FilterChips({ value, onChange, compact = false }: FilterChipsProps) {
  const filters: Array<{ value: FilterType; label: ReactNode }> = [
    { value: 'all', label: 'All' },
    { value: 'recent', label: 'Recent' },
    { value: 'nearby', label: 'Nearby' },
    { value: 'trending', label: 'Trending' },
  ]

  return (
    <div className={cn('flex flex-wrap gap-1.5', compact ? '' : 'gap-1.5')}>
      {filters.map((filter) => (
        <motion.button
          key={filter.value}
          onClick={() => onChange(filter.value)}
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
      ))}
    </div>
  )
}
