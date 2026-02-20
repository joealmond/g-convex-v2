import { type Product } from '@/lib/types'
import { Clock, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGeolocation } from '@/hooks/use-geolocation'
import { Badge } from '@/components/ui/badge'
import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/hooks/use-translation'
import { isIOS, isNative } from '@/lib/platform'
import { formatRelativeTimeI18n } from '@/lib/format-time'
import { formatDistance } from '@/lib/format-distance'

interface StoreListProps {
  product: Product
}

/**
 * Displays list of stores where product is available
 * - Store name
 * - Price ($ icon row)
 * - Last seen (relative time)
 * - Freshness indicator (green <7d, yellow <30d, faded >30d)
 * - "Near Me" badge for stores within 5km
 * - Tap to open in maps (Apple Maps on iOS, Google Maps elsewhere)
 */
export function StoreList({ product }: StoreListProps) {
  const { t } = useTranslation()
  const { coords } = useGeolocation()

  if (!product.stores || product.stores.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">{t('store.noStores')}</p>
        <p className="text-xs">{t('store.beFirst')}</p>
      </div>
    )
  }

  /**
   * Get freshness classes — green <7d, yellow <30d, gray >30d
   */
  const getFreshnessColor = (lastSeenAt: number): string => {
    const days = Math.floor((Date.now() - lastSeenAt) / 86400000)
    if (days < 7) return 'border-l-4 border-l-safety-high'
    if (days < 30) return 'border-l-4 border-l-safety-mid'
    return 'border-l-4 border-l-border opacity-70'
  }

  const renderPrice = (price?: number): string => {
    if (!price || price < 1 || price > 5) return '$'
    return '$'.repeat(Math.round(price))
  }

  const getStoreDistance = (store: (typeof product.stores)[0]): number | undefined => {
    if (!coords?.latitude || !coords?.longitude || !store.geoPoint) return undefined
    const latDiff = (store.geoPoint.lat - coords.latitude) * 111.32
    const lonDiff =
      (store.geoPoint.lng - coords.longitude) * 111.32 * Math.cos((coords.latitude * Math.PI) / 180)
    return Math.sqrt(latDiff ** 2 + lonDiff ** 2)
  }

  const isNearby = (store: (typeof product.stores)[0]): boolean => {
    const distance = getStoreDistance(store)
    return distance !== undefined && distance <= 5
  }

  /**
   * Open store location in maps — Apple Maps on iOS native, Google Maps elsewhere
   */
  const handleOpenMap = (store: (typeof product.stores)[0]) => {
    if (!store.geoPoint) return
    const { lat, lng } = store.geoPoint
    const label = encodeURIComponent(store.name)

    let mapsUrl: string
    if (isNative() && isIOS()) {
      // Apple Maps deep link
      mapsUrl = `maps:?q=${label}&ll=${lat},${lng}`
    } else {
      // Google Maps (works on Android native + web)
      mapsUrl = `https://maps.google.com/?q=${lat},${lng}(${label})`
    }
    window.open(mapsUrl, '_blank')
  }

  return (
    <div className="space-y-3">
      {product.stores.map((store, index) => {
        const distance = getStoreDistance(store)
        const nearby = isNearby(store)

        return (
          <div
            key={index}
            className={cn(
              'w-full p-4 bg-card rounded-xl border border-border hover:shadow-md transition-shadow',
              getFreshnessColor(store.lastSeenAt)
            )}
          >
            {/* Store Name */}
            <div className="flex items-center justify-between mb-2">
              <Link
                to="/store/$name"
                params={{ name: store.name }}
                className="font-semibold text-sm text-foreground hover:text-primary hover:underline truncate"
              >
                {store.name}
              </Link>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Near Me Badge */}
                {nearby && (
                  <Badge className="bg-safety-high text-white text-[10px] px-1.5 py-0.5">
                    📍 {t('store.nearMe')}
                  </Badge>
                )}
              </div>
            </div>

            {/* Details Row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {/* Last Seen */}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatRelativeTimeI18n(store.lastSeenAt, t)}</span>
              </div>

              {/* Distance */}
              {distance !== undefined && (
                <span className="text-xs">
                  {formatDistance(distance, t)}
                </span>
              )}

              {/* Price */}
              {store.price && (
                <div className="text-xs font-semibold text-foreground">
                  {renderPrice(store.price)}
                </div>
              )}

              {/* Map Link */}
              {store.geoPoint && (
                <button
                  onClick={() => handleOpenMap(store)}
                  className="flex items-center gap-1 hover:text-primary transition-colors ml-auto"
                >
                  <Navigation className="h-3 w-3" />
                  <span>{t('store.openInMaps')}</span>
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
