import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Suspense, useState, useMemo, lazy } from 'react'
import { FilterChips, type FilterType } from '@/components/feed/FilterChips'
import { Button } from '@/components/ui/button'
import { useGeolocation } from '@/hooks/use-geolocation'
import { getNearbyRange } from '@/hooks/use-product-filter'
import { isWeb } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useTranslation } from '@/hooks/use-translation'
import { z } from 'zod'

const mapSearchSchema = z.object({
  productId: z.string().optional(),
  name: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
})

function getProductDistance(product: Product, coords?: { latitude: number; longitude: number } | null): number | undefined {
  if (!coords?.latitude || !coords?.longitude || !product.stores || product.stores.length === 0) {
    return undefined
  }

  const distances = product.stores
    .filter((store) => store.geoPoint)
    .map((store) => {
      if (!store.geoPoint) return Infinity
      const latDiff = (store.geoPoint.lat - coords.latitude) * 111.32
      const lonDiff =
        (store.geoPoint.lng - coords.longitude) * 111.32 * Math.cos((coords.latitude * Math.PI) / 180)
      return Math.sqrt(latDiff ** 2 + lonDiff ** 2)
    })

  return distances.length > 0 ? Math.min(...distances) : undefined
}

// Lazy-load the map component to defer leaflet/react-leaflet bundle
const ProductMap = lazy(() =>
  import('@/components/map/ProductMap').then((mod) => ({ default: mod.ProductMap }))
)

export const Route = createFileRoute('/map')({
  validateSearch: mapSearchSchema,
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
  const search = Route.useSearch()
  const products = useQuery(api.products.listAll)
  const { coords, loading: geoLoading } = useGeolocation()
  const isBrowser = isWeb()
  const [filterType, setFilterType] = useState<FilterType>('all')

  const isLoading = products === undefined
  const [nearbyRange, setNearbyRange] = useState(() => getNearbyRange())
  const [showRangeCircle, setShowRangeCircle] = useState(false)

  const focusedProducts = useMemo(() => {
    if (!products || !search.productId) return undefined
    return products.filter((product) => product._id === search.productId)
  }, [products, search.productId])

  const focusedProduct = focusedProducts?.[0]

  const handleRangeChange = (km: number) => {
    setNearbyRange(km)
    setShowRangeCircle(true)
    setTimeout(() => setShowRangeCircle(false), 3000)
  }

  // Determine map center (user location or Budapest fallback)
  const mapCenter: [number, number] = useMemo(() => {
    if (typeof search.lat === 'number' && typeof search.lng === 'number') {
      return [search.lat, search.lng]
    }
    if (coords !== null && coords.latitude !== null && coords.longitude !== null) {
      return [coords.latitude, coords.longitude]
    }
    return [47.497, 19.04] // Budapest, Hungary
  }, [coords, search.lat, search.lng])

  /**
   * Filter products based on selected filter
   */
  const filteredProducts = useMemo(() => {
    if (!products) return []

    if (focusedProducts && focusedProducts.length > 0) {
      return focusedProducts.filter(
        (product) => product.stores && product.stores.some((store) => store.geoPoint)
      )
    }

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
            const distance = getProductDistance(p, coords)
            return distance !== undefined && distance <= nearbyRange
          })
          result.sort(
            (a, b) =>
              (getProductDistance(a, coords) || Infinity) - (getProductDistance(b, coords) || Infinity)
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
  }, [products, focusedProducts, filterType, coords, nearbyRange])

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
    <div className={cn(
      'absolute inset-x-0 md:bottom-0',
      isBrowser
        ? 'top-[calc(3.5rem+env(safe-area-inset-top,0px))] bottom-0'
        : 'top-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] md:top-[calc(3.5rem+env(safe-area-inset-top,0px))]'
    )}>
      {/* Filter Chips — floating over the map */}
      <div className={cn(
        'absolute z-[400] flex items-center gap-2 md:left-4 md:right-4 md:top-4',
        isBrowser
          ? 'left-4 right-4 top-4'
          : 'left-[4.75rem] right-2 top-[calc(env(safe-area-inset-top,0px)+0.5rem)] sm:left-2'
      )}>
        <FilterChips 
          value={filterType} 
          onChange={setFilterType} 
          nearbyRange={nearbyRange}
          onRangeChange={handleRangeChange}
          compact
        />
        {geoLoading && (
          <span className="text-[10px] text-muted-foreground whitespace-nowrap rounded-full bg-background/80 px-2 py-0.5">
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
            zoom={focusedProduct ? 15 : 13}
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

      {focusedProduct && (
        <div className="absolute bottom-16 left-2 right-2 z-[400] md:bottom-4 md:left-auto md:right-4 md:w-[22rem]">
          <div className="rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {t('location.focusedProduct')}
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">{focusedProduct.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('location.focusedProductHint')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to="/product/$name" params={{ name: focusedProduct.name }}>
                  {t('productMap.viewProduct')}
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/map">{t('location.showAllProducts')}</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
