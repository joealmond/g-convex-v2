'use client'

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type FilterType = 'all' | 'recent' | 'nearby' | 'trending'

interface FilterChipsProps {
  value: FilterType
  onChange: (filter: FilterType) => void
}

/**
 * Horizontal scrollable filter chips
 * Single-select (one active at a time)
 * - All: default sort by lastUpdated desc
 * - Recent: sort by createdAt desc
 * - Nearby: filter to products within 5km
 * - Trending: sort by voteCount desc
 */
export function FilterChips({ value, onChange }: FilterChipsProps) {
  const filters: Array<{ value: FilterType; label: ReactNode }> = [
    { value: 'all', label: 'All' },
    { value: 'recent', label: 'Recently Added' },
    { value: 'nearby', label: 'Nearby' },
    { value: 'trending', label: 'Trending' },
  ]

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((filter) => (
        <motion.button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={cn(
            'px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 min-h-[44px]',
            value === filter.value
              ? 'bg-color-primary text-white'
              : 'bg-color-bg text-color-text-secondary border border-color-border hover:bg-white'
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
