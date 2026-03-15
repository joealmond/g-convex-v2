import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { type Product, getQuadrant, QUADRANTS } from '@/lib/types'
import { appConfig } from '@/lib/app-config'
import { DeleteProductButton } from '@/components/dashboard/DeleteProductButton'
import { VoteProductDialog } from '@/components/product/VoteProductDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Trash2, AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'
import { formatDistance } from '@/lib/format-distance'
import { findAllergenConflicts } from '@/lib/dietary-profiles'
import {
  computeSafetyDisplayMeta,
  deriveAllergenConfidence,
  deriveSafetyDisplayState,
  SAFETY_REVIEW_VOTE_TARGET,
  type AllergenScoresMap,
} from '@/lib/score-utils'

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

  // Get quadrant info
  const quadrant = getQuadrant(product.averageSafety, product.averageTaste)
  const quadrantInfo = QUADRANTS[quadrant]
  const safetyMeta = computeSafetyDisplayMeta(
    (product.allergenScores as AllergenScoresMap | undefined) ?? undefined,
    avoidedAllergens,
  )
  const safetyState = deriveSafetyDisplayState(safetyMeta.score, safetyMeta.voteCount)
  const safetyConfidence = deriveAllergenConfidence(safetyMeta.voteCount)

  const safetyStateLabel = safetyState === 'likely-safe'
    ? t('voting.likelySafe')
    : safetyState === 'likely-unsafe'
      ? t('voting.likelyUnsafe')
      : t('voting.needsReviewProgress', {
          current: Math.min(safetyMeta.voteCount, SAFETY_REVIEW_VOTE_TARGET),
          target: SAFETY_REVIEW_VOTE_TARGET,
        })

  const safetyConfidenceLabel = safetyConfidence === 'high'
    ? t('voting.highConfidence')
    : safetyConfidence === 'medium'
      ? t('voting.mediumConfidence')
      : t('voting.lowConfidence')

  const safetyStateClass = safetyState === 'likely-safe'
    ? 'border-safety-high/35 bg-safety-high/15 text-foreground'
    : safetyState === 'likely-unsafe'
      ? 'border-safety-low/35 bg-safety-low/15 text-foreground'
      : 'border-safety-mid/45 bg-safety-mid/20 text-foreground'

  // Check if product has location data
  const hasLocation = product.stores?.some(s => s.geoPoint)

  return (
    <motion.div
      className="bg-card text-card-foreground rounded-2xl overflow-hidden shadow-card h-full flex flex-col border border-border md:min-h-[29rem] md:rounded-3xl md:bg-card xl:min-h-[33rem]"
      whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Link
        to={'/product/$name'}
        params={{ name: product.name }}
        className="group flex h-full flex-1 cursor-pointer flex-col"
        preload="intent"
      >
        {/* Product Image */}
        <div className="relative aspect-square bg-background overflow-hidden lg:aspect-[4/3] xl:aspect-[5/4]">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform md:p-3"
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
        <div className="p-3 flex-1 flex flex-col justify-between md:min-w-0 md:p-5 lg:p-6">
          {/* Product Name */}
          <h3 className="font-semibold text-sm leading-tight text-foreground transition-colors group-hover:text-primary md:min-h-[2.5rem] md:text-base lg:min-h-[3rem] lg:text-lg">
            {product.name}
          </h3>

          {/* Distance (if available) */}
          {distanceKm !== undefined && (
            <p className="text-xs text-muted-foreground mt-1 md:text-sm">
              {formatDistance(distanceKm, t)}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 md:mt-4">
            <Badge className={safetyStateClass} variant="outline">
              {safetyStateLabel}
            </Badge>
            <Badge variant="outline" className="border-border bg-muted/40 text-muted-foreground">
              {t('voting.confidence')}: {safetyConfidenceLabel}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:text-sm">
            <span>{product.voteCount} {product.voteCount === 1 ? t('common.vote') : t('common.votes')}</span>
            {safetyState === 'needs-review' ? (
              <span>{safetyMeta.voteCount === 0 ? t('voting.noVotesYetAllergen') : t('voting.reviewStillOpen')}</span>
            ) : (
              <span>{appConfig.dimensions.axis2.label}: {Math.round(product.averageTaste)}</span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${getSafetyColor(product.averageSafety)}`}
              title={`${appConfig.dimensions.axis1.label}: ${product.averageSafety.toFixed(0)}`}
            />
            <span className="text-[11px] text-muted-foreground md:text-xs">
              {appConfig.dimensions.axis1.label}
            </span>
          </div>

          <div
            className="mt-4 md:mt-5"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <VoteProductDialog
              product={product}
              trigger={
                <Button size="sm" variant="outline" className="w-full rounded-xl border-primary/30 bg-primary/5 font-semibold text-primary hover:bg-primary/10 md:h-11 md:text-sm lg:h-12">
                  {t('product.voteAction')}
                </Button>
              }
            />
          </div>
        </div>

      </Link>
    </motion.div>
  )
}
