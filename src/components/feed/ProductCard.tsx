import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { type Product, getQuadrant, QUADRANTS } from '@/lib/types'
import { appConfig } from '@/lib/app-config'
import { DeleteProductButton } from '@/components/dashboard/DeleteProductButton'
import { MapPin, Trash2, AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'
import { formatDistance } from '@/lib/format-distance'
import { findAllergenConflicts } from '@convex/dietaryProfiles'

interface ProductCardProps {
  product: Product
  distanceKm?: number
  isAdmin?: boolean
  /** User's avoided allergen IDs — used to show warning indicator */
  avoidedAllergens?: string[]
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
export function ProductCard({ product, distanceKm, isAdmin, avoidedAllergens = [] }: ProductCardProps) {
  const { t } = useTranslation()
  
  // Check for allergen conflicts
  const allergenConflicts = findAllergenConflicts(product.allergens, avoidedAllergens)
  
  // Determine safety score color
  const getSafetyColor = (score: number) => {
    if (score >= 60) return 'bg-safety-high' // Green
    if (score >= 40) return 'bg-safety-mid' // Yellow/Amber
    return 'bg-safety-low' // Red
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
        <div className="relative aspect-square bg-background overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              {t('common.noImage')}
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
                variant="ghost"
                size="icon" 
                className="h-6 w-6 bg-card/90 hover:bg-destructive hover:text-white dark:bg-card/80 dark:hover:bg-destructive shadow-sm rounded-full p-0"
              >
                <Trash2 className="h-3 w-3 text-destructive group-hover:text-white" />
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

          {/* Allergen Warning (bottom-right) */}
          {allergenConflicts.length > 0 && (
            <div 
              className="absolute bottom-2 right-2 z-10 bg-safety-low text-white p-1 rounded-full shadow-sm"
              title={t('allergens.conflict')}
            >
              <AlertTriangle className="h-3 w-3" />
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-3 flex-1 flex flex-col justify-between">
          {/* Product Name */}
          <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Distance (if available) */}
          {distanceKm !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistance(distanceKm, t)}
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
          <p className="text-xs text-muted-foreground mt-2">
            {product.voteCount} {product.voteCount === 1 ? t('common.vote') : t('common.votes')}
          </p>
        </div>
      </motion.div>
    </Link>
  )
}
