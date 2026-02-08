'use client'

import { type Product } from '@/lib/types'
import { MapPin, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGeolocation } from '@/hooks/use-geolocation'
import { Badge } from '@/components/ui/badge'
import { Link } from '@tanstack/react-router'

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
 * - Tap to open in maps
 */
export function StoreList({ product }: StoreListProps) {
  const { coords } = useGeolocation()

  if (!product.stores || product.stores.length === 0) {
    return (
      <div className="text-center py-8 text-color-text-secondary">
        <p className="text-sm">No stores recorded yet</p>
        <p className="text-xs">Be the first to add a location!</p>
      </div>
    )
  }

  /**
   * Format relative time (ago)
   */
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'just now'
  }

  /**
   * Get freshness indicator color
   */
  const getFreshnessColor = (lastSeenAt: number): string => {
    const days = Math.floor((Date.now() - lastSeenAt) / (1000 * 60 * 60 * 24))
    if (days < 7) return 'border-l-4 border-l-color-safety-high' // Green
    if (days < 30) return 'border-l-4 border-l-color-safety-mid' // Yellow
    return 'border-l-4 border-l-color-border' // Gray
  }

  /**
   * Render price as $ icons
   */
  const renderPrice = (price?: number): string => {
    if (!price || price < 1 || price > 5) return '$'
    return '$'.repeat(Math.round(price))
  }

  /**
   * Calculate distance to store in km
   */
  const getStoreDistance = (store: (typeof product.stores)[0]): number | undefined => {
    if (!coords?.latitude || !coords?.longitude || !store.geoPoint) {
      return undefined
    }

    const latDiff = (store.geoPoint.lat - coords.latitude) * 111.32
    const lonDiff =
      (store.geoPoint.lng - coords.longitude) * 111.32 * Math.cos((coords.latitude * Math.PI) / 180)
    return Math.sqrt(latDiff ** 2 + lonDiff ** 2)
  }

  /**
   * Check if store is nearby (≤5km)
   */
  const isNearby = (store: (typeof product.stores)[0]): boolean => {
    const distance = getStoreDistance(store)
    return distance !== undefined && distance <= 5
  }

  /**
   * Open store location in maps
   */
  const handleOpenMap = (store: (typeof product.stores)[0]) => {
    if (!store.geoPoint) {
      // Could show a toast warning
      return
    }

    const { lat, lng } = store.geoPoint
    const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`
    window.open(mapsUrl, '_blank')
  }

  return (
    <div className="space-y-3">
      {product.stores.map((store, index) => (
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
              className="font-semibold text-sm text-color-text hover:text-color-primary hover:underline"
            >
              {store.name}
            </Link>

            {/* Near Me Badge */}
            {isNearby(store) && (
              <Badge className="bg-color-safety-high text-white text-xs">
                📍 Nearby
              </Badge>
            )}
          </div>

          {/* Details Row */}
          <div className="flex items-center gap-4 text-xs text-color-text-secondary">
            {/* Last Seen */}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(store.lastSeenAt)}</span>
            </div>

            {/* Price */}
            {store.price && (
              <div className="text-xs font-semibold text-color-text">
                {renderPrice(store.price)}
              </div>
            )}

            {/* Map Link */}
            {store.geoPoint && (
              <button
                onClick={() => handleOpenMap(store)}
                className="flex items-center gap-1 hover:text-color-primary transition-colors"
              >
                <MapPin className="h-3 w-3" />
                <span>Open in maps</span>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
