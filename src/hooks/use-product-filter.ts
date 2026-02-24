import { useState, useMemo, useCallback, useEffect } from 'react'
import type { FilterType } from '@/components/feed/FilterChips'
import type { Product } from '@/lib/types'

/** Default nearby range in km, overridden by localStorage "g-matrix-nearby-range" */
const DEFAULT_NEARBY_RANGE_KM = 5

/** Read user's preferred nearby range from localStorage (SSR-safe) */
export function getNearbyRange(): number {
  if (typeof window === 'undefined') return DEFAULT_NEARBY_RANGE_KM
  const stored = localStorage.getItem('g-matrix-nearby-range')
  if (stored) {
    const parsed = parseFloat(stored)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return DEFAULT_NEARBY_RANGE_KM
}

/** Persist the user's preferred nearby range */
export function setNearbyRange(km: number) {
  localStorage.setItem('g-matrix-nearby-range', String(km))
  // Dispatch event so listening hooks re-render
  window.dispatchEvent(new CustomEvent('g-matrix-nearby-range-change'))
}

/** Available range presets (km) */
export const NEARBY_RANGE_OPTIONS = [1, 2, 5, 10, 25, 50] as const

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
  nearbyProducts?: (Product & { distance?: number })[] | undefined
  latitude?: number
  longitude?: number
}

export function useProductFilter({ products, nearbyProducts, latitude, longitude }: UseProductFilterOptions) {
  const [filterType, setFilterType] = useState<FilterType>('nearby')
  const [searchQuery, setSearchQuery] = useState('')
  const [nearbyRange, setNearbyRangeState] = useState(DEFAULT_NEARBY_RANGE_KM)

  // Sync range from localStorage + listen for changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    setNearbyRangeState(getNearbyRange())
    const handler = () => setNearbyRangeState(getNearbyRange())
    window.addEventListener('g-matrix-nearby-range-change', handler)
    return () => window.removeEventListener('g-matrix-nearby-range-change', handler)
  }, [])

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
        // Use geospatial results if available and non-empty, otherwise fall back
        // to client-side distance filtering using product store coordinates.
        if (nearbyProducts && nearbyProducts.length > 0) {
          result = nearbyProducts as Product[]
        } else if (latitude && longitude) {
          // Client-side fallback: filter by store geoPoint distance
          result = result.filter((p) => {
            const distance = getDistance(p)
            return distance !== undefined && distance <= nearbyRange
          })
          result.sort(
            (a, b) => (getDistance(a) || Infinity) - (getDistance(b) || Infinity)
          )
        } else {
          // No location available — show all products sorted by recency
          result.sort((a, b) => b.createdAt - a.createdAt)
        }
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
  }, [products, filterType, searchQuery, getDistance, nearbyRange, nearbyProducts, latitude, longitude])

  // Note: auto-fallback from 'nearby' to 'recent' was removed — the nearby filter
  // now always shows products (sorted by distance when possible, by recency otherwise).

  /** Whether current filter uses card grid layout (recent, trending, nearby) vs strip list (all) */
  const useCardLayout = filterType !== 'all'

  return {
    filterType,
    searchQuery,
    filteredProducts,
    useCardLayout,
    nearbyRange,
    handleSearchChange,
    clearSearch,
    handleFilterChange,
    getDistance,
  }
}
