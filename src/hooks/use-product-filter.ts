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
  const [hasAutoFallback, setHasAutoFallback] = useState(false)

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
        // If server returned results via nearbyProducts (which already applied distance limits),
        // we use them directly. If undefined, we fallback to client-side math.
        if (nearbyProducts !== undefined) {
          result = nearbyProducts as Product[]
        } else {
          result = result.filter((p) => {
            const distance = getDistance(p)
            return distance !== undefined && distance <= nearbyRange
          })
          result.sort(
            (a, b) => (getDistance(a) || Infinity) - (getDistance(b) || Infinity)
          )
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
  }, [products, filterType, searchQuery, getDistance, nearbyRange])

  // Auto-fallback: if "nearby" returns 0 results (no GPS or no products within range),
  // automatically switch to "recent"
  useEffect(() => {
    if (filterType === 'nearby' && products && products.length > 0 && filteredProducts.length === 0 && !hasAutoFallback) {
      setHasAutoFallback(true)
      setFilterType('recent')
    }
  }, [filterType, products, filteredProducts.length, hasAutoFallback])

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
