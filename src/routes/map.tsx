import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Suspense, useState, useMemo } from 'react'
import { ProductMap } from '@/components/map/ProductMap'
import { FilterChips, type FilterType } from '@/components/feed/FilterChips'
import { useGeolocation } from '@/hooks/use-geolocation'
import { Loader2 } from 'lucide-react'
import type { Product } from '@/lib/types'

export const Route = createFileRoute('/map')({
  component: MapPage,
})

function MapPageSkeleton() {
  return (
    <div className="flex-1 relative">
      <div className="absolute inset-0 bg-color-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-color-text-secondary" />
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
  const products = useQuery(api.products.list)
  const { coords, loading: geoLoading } = useGeolocation()
  const [filterType, setFilterType] = useState<FilterType>('all')

  const isLoading = products === undefined

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
        if (coords?.latitude !== null && coords?.longitude !== null) {
          result = result.filter((p) => {
            const distance = getProductDistance(p)
            return distance !== undefined && distance <= 10 // 10km radius
          })
          result.sort(
            (a, b) =>
              (getProductDistance(a) || Infinity) - (getProductDistance(b) || Infinity)
          )
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
  }, [products, filterType, coords])

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Filter Chips */}
      <div className="absolute top-4 left-4 right-4 z-10 bg-white rounded-xl shadow-lg p-3">
        <FilterChips value={filterType} onChange={setFilterType} />
        {geoLoading && (
          <p className="text-xs text-color-text-secondary mt-2 text-center">
            Getting your location...
          </p>
        )}
        {filterType === 'nearby' && !coords?.latitude && !geoLoading && (
          <p className="text-xs text-color-text-secondary mt-2 text-center">
            Enable location to see nearby products
          </p>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 bg-color-bg flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-color-text-secondary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="absolute inset-0 bg-color-bg flex items-center justify-center">
            <div className="text-center px-4">
              <p className="text-color-text-secondary mb-2">No products found</p>
              <p className="text-xs text-color-text-secondary">
                Try adjusting your filters or add products with store locations
              </p>
            </div>
          </div>
        ) : (
          <ProductMap products={filteredProducts} center={mapCenter} zoom={13} />
        )}
      </div>

      {/* Product Count Badge */}
      {!isLoading && filteredProducts.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white rounded-full shadow-lg px-4 py-2">
          <p className="text-xs font-semibold text-color-text">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
        </div>
      )}
    </div>
  )
}
