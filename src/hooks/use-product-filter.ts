import { useState, useMemo, useCallback } from 'react'
import type { FilterType } from '@/components/feed/FilterChips'
import type { Product } from '@/lib/types'

/**
 * Simple fuzzy match — checks if all characters in query appear in order in target
 */
function fuzzyMatch(target: string, query: string): boolean {
  const lowerTarget = target.toLowerCase()
  const lowerQuery = query.toLowerCase().trim()
  if (!lowerQuery) return true

  let qi = 0
  for (let ti = 0; ti < lowerTarget.length && qi < lowerQuery.length; ti++) {
    if (lowerTarget[ti] === lowerQuery[qi]) qi++
  }
  return qi === lowerQuery.length
}

/**
 * Calculate distance between user coords and nearest product store in km
 */
function getProductDistance(
  product: Product,
  latitude?: number,
  longitude?: number
): number | undefined {
  if (!latitude || !longitude || !product.stores || product.stores.length === 0) {
    return undefined
  }

  const distances = product.stores
    .filter((store) => store.geoPoint)
    .map((store) => {
      if (!store.geoPoint) return Infinity
      const latDiff = (store.geoPoint.lat - latitude) * 111.32
      const lonDiff =
        (store.geoPoint.lng - longitude) * 111.32 * Math.cos((latitude * Math.PI) / 180)
      return Math.sqrt(latDiff ** 2 + lonDiff ** 2)
    })

  return distances.length > 0 ? Math.min(...distances) : undefined
}

interface UseProductFilterOptions {
  products: Product[] | undefined
  latitude?: number
  longitude?: number
}

export function useProductFilter({ products, latitude, longitude }: UseProductFilterOptions) {
  const [filterType, setFilterType] = useState<FilterType>('recent')
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    if (value.trim()) {
      setFilterType('all')
    }
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  const handleFilterChange = useCallback(
    (f: FilterType) => {
      setFilterType(f)
      if (f !== 'all') setSearchQuery('')
    },
    []
  )

  const getDistance = useCallback(
    (product: Product) => getProductDistance(product, latitude, longitude),
    [latitude, longitude]
  )

  const filteredProducts = useMemo(() => {
    if (!products) return []

    let result = [...products]

    // Apply search filter for "all" mode
    if (filterType === 'all' && searchQuery.trim()) {
      result = result.filter((p) => fuzzyMatch(p.name, searchQuery))
    }

    // Apply filters
    switch (filterType) {
      case 'recent':
        result.sort((a, b) => b.createdAt - a.createdAt)
        break
      case 'nearby':
        result = result.filter((p) => {
          const distance = getDistance(p)
          return distance !== undefined && distance <= 5
        })
        result.sort(
          (a, b) => (getDistance(a) || Infinity) - (getDistance(b) || Infinity)
        )
        break
      case 'trending':
        result.sort((a, b) => b.voteCount - a.voteCount)
        break
      case 'all':
      default:
        result.sort((a, b) => b.lastUpdated - a.lastUpdated)
        break
    }

    return result
  }, [products, filterType, searchQuery, getDistance])

  /** Whether current filter uses card grid layout (recent, trending, nearby) vs strip list (all) */
  const useCardLayout = filterType !== 'all'

  return {
    filterType,
    searchQuery,
    filteredProducts,
    useCardLayout,
    handleSearchChange,
    clearSearch,
    handleFilterChange,
    getDistance,
  }
}
