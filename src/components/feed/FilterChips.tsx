'use client'

import { type ReactNode } from 'react'
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
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0',
            value === filter.value
              ? 'bg-color-primary text-white'
              : 'bg-color-bg text-color-text-secondary border border-color-border hover:bg-white'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
