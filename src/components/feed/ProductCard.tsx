'use client'

import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { type Product, getQuadrant, QUADRANTS } from '@/lib/types'
import { appConfig } from '@/lib/app-config'
import { DeleteProductButton } from '@/components/dashboard/DeleteProductButton'
import { MapPin, Trash2 } from 'lucide-react'

interface ProductCardProps {
  product: Product
  distanceKm?: number
  isAdmin?: boolean
}

/**
 * Product card for feed view
 * - 3 colored dots for axis1/axis2/axis3 scores
 * - Square product image (rounded)
 * - Product name (1-line truncate)
 * - Distance from user (optional)
 * - Quadrant badge
 * - Tappable to product detail
 */
export function ProductCard({ product, distanceKm, isAdmin }: ProductCardProps) {
  // Determine safety score color
  const getSafetyColor = (score: number) => {
    if (score >= 60) return 'bg-color-safety-high' // Green
    if (score >= 40) return 'bg-color-safety-mid' // Yellow/Amber
    return 'bg-color-safety-low' // Red
  }

  // Get price score from avgPrice (1-5 scale → 0-100)
  const priceScore = product.avgPrice ? (product.avgPrice / 5) * 100 : 0

  // Get quadrant info
  const quadrant = getQuadrant(product.averageSafety, product.averageTaste)
  const quadrantInfo = QUADRANTS[quadrant]

  // Check if product has location data
  const hasLocation = product.stores?.some(s => s.geoPoint)

  return (
    <Link
      to={'/product/$name'}
      params={{ name: product.name }}
      className="group cursor-pointer h-full block"
      preload="intent"
    >
      <motion.div
        className="bg-card text-card-foreground rounded-2xl overflow-hidden shadow-card h-full flex flex-col"
        whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* Product Image */}
        <div className="relative aspect-square bg-color-bg overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-color-text-secondary text-sm">
              No image
            </div>
          )}

          {/* Quadrant Badge (top-right) */}
          {quadrantInfo && (
            <div
              className="absolute top-2 right-2 px-2 py-1 rounded-full text-white text-xs font-semibold"
              style={{ backgroundColor: quadrantInfo.color }}
              title={quadrantInfo.name}
            >
              {appConfig.quadrants[quadrant]?.emoji || '●'}
            </div>
          )}

          {/* Admin Delete Button (top-left) */}
          {isAdmin && (
            <div 
              className="absolute top-2 left-2 z-10"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <DeleteProductButton 
                product={product} 
                size="icon" 
                className="h-7 w-7 bg-white/90 hover:bg-white shadow-sm rounded-full"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                <span className="sr-only">Delete</span>
              </DeleteProductButton>
            </div>
          )}

          {/* Geolocation Icon (bottom-left) */}
          {hasLocation && (
            <div 
              className="absolute bottom-2 left-2 z-10 bg-blue-500 text-white p-1 rounded-full shadow-sm"
              title="Has location data"
            >
              <MapPin className="h-3 w-3" />
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-3 flex-1 flex flex-col justify-between">
          {/* Product Name */}
          <h3 className="font-semibold text-sm text-color-text truncate group-hover:text-color-primary transition-colors">
            {product.name}
          </h3>

          {/* Distance (if available) */}
          {distanceKm !== undefined && (
            <p className="text-xs text-color-text-secondary mt-1">
              {distanceKm < 0.1
                ? 'Very close'
                : distanceKm < 1
                  ? `${(distanceKm * 1000).toFixed(0)}m away`
                  : `${distanceKm.toFixed(1)}km away`}
            </p>
          )}

          {/* Scoring Dots Row */}
          <div className="flex gap-2 mt-2">
            {/* Axis 1 (Safety) Dot */}
            <div
              className={`w-2 h-2 rounded-full ${getSafetyColor(product.averageSafety)}`}
              title={`${appConfig.dimensions.axis1.label}: ${product.averageSafety.toFixed(0)}`}
            />

            {/* Axis 2 (Taste) Dot */}
            <div
              className={`w-2 h-2 rounded-full ${getSafetyColor(product.averageTaste)}`}
              title={`${appConfig.dimensions.axis2.label}: ${product.averageTaste.toFixed(0)}`}
            />

            {/* Axis 3 (Price) Dot */}
            <div
              className={`w-2 h-2 rounded-full ${getSafetyColor(priceScore)}`}
              title={`${appConfig.dimensions.axis3.label}: ${priceScore.toFixed(0)}`}
            />
          </div>

          {/* Vote Count */}
          <p className="text-xs text-color-text-secondary mt-2">
            {product.voteCount} {product.voteCount === 1 ? 'vote' : 'votes'}
          </p>
        </div>
      </motion.div>
    </Link>
  )
}
