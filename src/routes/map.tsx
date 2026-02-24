import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Suspense, useState, useMemo, useEffect, lazy } from 'react'
import { FilterChips, type FilterType } from '@/components/feed/FilterChips'
import { useGeolocation } from '@/hooks/use-geolocation'
import { getNearbyRange } from '@/hooks/use-product-filter'
import { Loader2 } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useTranslation } from '@/hooks/use-translation'

// Lazy-load the map component to defer leaflet/react-leaflet bundle
const ProductMap = lazy(() =>
  import('@/components/map/ProductMap').then((mod) => ({ default: mod.ProductMap }))
)

export const Route = createFileRoute('/map')({
  component: MapPage,
})

function MapPageSkeleton() {
  return (
    <div className="flex-1 relative">
      <div className="absolute inset-0 bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  )
}

function MapPage() {
  return (
    <Suspense fallback={<MapPageSkeleton />}>
      <MapPageContent />
    </Suspense>
  )
}

function MapPageContent() {
  const { t } = useTranslation()
  const products = useQuery(api.products.listAll)
  const { coords, loading: geoLoading, requestLocation } = useGeolocation()
  const [filterType, setFilterType] = useState<FilterType>('all')

  // Auto-request location on mount
  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  const isLoading = products === undefined
  const [nearbyRange, setNearbyRange] = useState(10) // Will sync on mount
  const [showRangeCircle, setShowRangeCircle] = useState(false)

  // Initialize range from user's default setting
  useEffect(() => {
    if (typeof window === 'undefined') return
    setNearbyRange(getNearbyRange())
    // Note: We don't listen to 'g-matrix-default-nearby-range-change' here
    // because changing the default in Profile shouldn't instantly affect an
    // active Map session (or at least, the session range has detached).
  }, [])

  const handleRangeChange = (km: number) => {
    setNearbyRange(km)
    setShowRangeCircle(true)
    setTimeout(() => setShowRangeCircle(false), 3000)
  }

  // Determine map center (user location or Budapest fallback)
  const mapCenter: [number, number] = useMemo(() => {
    if (coords !== null && coords.latitude !== null && coords.longitude !== null) {
      return [coords.latitude, coords.longitude]
    }
    return [47.497, 19.04] // Budapest, Hungary
  }, [coords])

  /**
   * Helper: calculate distance between user and product stores in km
   */
  const getProductDistance = (product: Product): number | undefined => {
    if (!coords?.latitude || !coords?.longitude || !product.stores || product.stores.length === 0) {
      return undefined
    }

    const distances = product.stores
      .filter((store) => store.geoPoint)
      .map((store) => {
        if (!store.geoPoint || !coords) return Infinity
        const latDiff = (store.geoPoint.lat - coords.latitude) * 111.32
        const lonDiff =
          (store.geoPoint.lng - coords.longitude) * 111.32 * Math.cos((coords.latitude * Math.PI) / 180)
        return Math.sqrt(latDiff ** 2 + lonDiff ** 2)
      })

    return distances.length > 0 ? Math.min(...distances) : undefined
  }

  /**
   * Filter products based on selected filter
   */
  const filteredProducts = useMemo(() => {
    if (!products) return []

    let result = [...products]

    // Filter to only products with GPS locations
    result = result.filter(
      (p) => p.stores && p.stores.some((store) => store.geoPoint)
    )

    switch (filterType) {
      case 'recent':
        result.sort((a, b) => b.createdAt - a.createdAt)
        break
      case 'nearby':
        if (coords?.latitude && coords?.longitude) {
          result = result.filter((p) => {
            const distance = getProductDistance(p)
            return distance !== undefined && distance <= nearbyRange
          })
          result.sort(
            (a, b) =>
              (getProductDistance(a) || Infinity) - (getProductDistance(b) || Infinity)
          )
        } else {
          // If nearby selected but no location, fall back to showing all locations but keep sort order
           result.sort((a, b) => b.lastUpdated - a.lastUpdated)
        }
        break
      case 'trending':
        result.sort((a, b) => b.voteCount - a.voteCount)
        break
      case 'all':
      default:
        // Show all products with locations
        break
    }

    return result
  }, [products, filterType, coords, nearbyRange])

  // Count total map markers (each store with a geoPoint = 1 marker)
  const markerCount = useMemo(() => {
    return filteredProducts.reduce((total, p) => {
      const storesWithGeo = p.stores?.filter((s) => s.geoPoint)?.length || 0
      return total + storesWithGeo
    }, 0)
  }, [filteredProducts])

  // User location for passing to map (blue circle)
  const userLocation: [number, number] | undefined = useMemo(() => {
    if (coords?.latitude && coords?.longitude) {
      return [coords.latitude, coords.longitude]
    }
    return undefined
  }, [coords])

  return (
    <div className="absolute inset-0 top-0 md:top-12" style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Filter Chips — floating over the map */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+0.5rem)] md:top-2 left-2 right-2 z-[400] flex items-center gap-2">
        <FilterChips 
          value={filterType} 
          onChange={setFilterType} 
          nearbyRange={nearbyRange}
          onRangeChange={handleRangeChange}
        />
        {geoLoading && (
          <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-background/80 rounded-full px-2 py-0.5">
            {t('location.locating')}
          </span>
        )}
      </div>

      {/* Map — fills entire available area */}
      {isLoading ? (
        <div className="absolute inset-0 bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <ProductMap
            products={filteredProducts}
            center={mapCenter}
            zoom={13}
            userLocation={userLocation}
            nearbyRange={nearbyRange * 1000} // ProductMap expects meters
            showRangeCircle={showRangeCircle}
          />
          {filteredProducts.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center px-4 bg-card/90 rounded-xl p-4 shadow-lg">
                <p className="text-foreground mb-2">{t('location.noProductsWithLocation')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('location.noProductsHint')}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Map Markers Badge — count matches cluster numbering */}
      {!isLoading && filteredProducts.length > 0 && (
        <div className="absolute bottom-4 left-2 z-[400] bg-card rounded-full shadow-lg px-3 py-1.5">
          <p className="text-xs font-semibold text-foreground">
            {t('location.pins', { count: markerCount })} · {t('location.productsCount', { count: filteredProducts.length })}
          </p>
        </div>
      )}
    </div>
  )
}
