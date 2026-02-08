'use client'

import { type Product } from '@/lib/types'
import { MapPin, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StoreListProps {
  product: Product
}

/**
 * Displays list of stores where product is available
 * - Store name
 * - Price ($ icon row)
 * - Last seen (relative time)
 * - Freshness indicator (green <7d, yellow <30d, faded >30d)
 * - Tap to open in maps
 */
export function StoreList({ product }: StoreListProps) {
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
        <button
          key={index}
          onClick={() => handleOpenMap(store)}
          className={cn(
            'w-full text-left p-4 bg-white rounded-xl border border-color-border hover:shadow-md transition-shadow',
            getFreshnessColor(store.lastSeenAt)
          )}
        >
          {/* Store Name */}
          <h4 className="font-semibold text-sm text-color-text mb-2">{store.name}</h4>

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

            {/* Distance */}
            {store.geoPoint && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>Open in maps</span>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
