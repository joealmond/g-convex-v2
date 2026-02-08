'use client'

import { Link } from '@tanstack/react-router'
import { type Product, getQuadrant, QUADRANTS } from '@/lib/types'
import { appConfig } from '@/lib/app-config'
import { MapPin } from 'lucide-react'

interface ProductStripProps {
  product: Product
  distanceKm?: number
  /** Highlight substring from fuzzy search */
  highlight?: string
}

/**
 * Horizontal strip/list-item for "All" filter view
 * Shows: thumbnail | name + scores | mini map pin indicator
 * Compact single-row layout for search results
 */
export function ProductStrip({ product, distanceKm, highlight }: ProductStripProps) {
  const getSafetyColor = (score: number) => {
    if (score >= 60) return 'bg-safety-high'
    if (score >= 40) return 'bg-safety-mid'
    return 'bg-safety-low'
  }

  const quadrant = getQuadrant(product.averageSafety, product.averageTaste)
  const quadrantInfo = QUADRANTS[quadrant]
  const priceScore = product.avgPrice ? (product.avgPrice / 5) * 100 : 0
  const hasLocation = product.stores?.some((s) => s.geoPoint)

  // Get first store location for mini map
  const firstStore = product.stores?.find((s) => s.geoPoint)

  /** Highlight matching text in product name */
  const renderName = () => {
    if (!highlight || !highlight.trim()) {
      return <span>{product.name}</span>
    }
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = product.name.split(regex)
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-primary/20 text-foreground rounded-sm px-0.5">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    )
  }

  return (
    <Link
      to="/product/$name"
      params={{ name: product.name }}
      className="group block"
      preload="intent"
    >
      <div className="flex items-center gap-3 bg-card rounded-xl p-2 pr-3 border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all">
        {/* Thumbnail */}
        <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain p-0.5"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[8px]">
              No img
            </div>
          )}
          {/* Quadrant color strip */}
          {quadrantInfo && (
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ backgroundColor: quadrantInfo.color }}
            />
          )}
        </div>

        {/* Name + Meta */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {renderName()}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            {/* Score dots */}
            <div className="flex gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${getSafetyColor(product.averageSafety)}`}
                title={`${appConfig.dimensions.axis1.label}: ${product.averageSafety.toFixed(0)}`}
              />
              <div
                className={`w-1.5 h-1.5 rounded-full ${getSafetyColor(product.averageTaste)}`}
                title={`${appConfig.dimensions.axis2.label}: ${product.averageTaste.toFixed(0)}`}
              />
              <div
                className={`w-1.5 h-1.5 rounded-full ${getSafetyColor(priceScore)}`}
                title={`${appConfig.dimensions.axis3.label}: ${priceScore.toFixed(0)}`}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {product.voteCount} {product.voteCount === 1 ? 'vote' : 'votes'}
            </span>
            {distanceKm !== undefined && (
              <span className="text-[10px] text-muted-foreground">
                · {distanceKm < 1 ? `${(distanceKm * 1000).toFixed(0)}m` : `${distanceKm.toFixed(1)}km`}
              </span>
            )}
          </div>
        </div>

        {/* Right side: location indicator or quadrant */}
        <div className="flex-shrink-0 flex items-center gap-1.5">
          {hasLocation && (
            <div className="text-blue-500" title={firstStore?.name || 'Has location'}>
              <MapPin className="h-3.5 w-3.5" />
            </div>
          )}
          {quadrantInfo && (
            <span className="text-xs" title={quadrantInfo.name}>
              {appConfig.quadrants[quadrant]?.emoji || '●'}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
