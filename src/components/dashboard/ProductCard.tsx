import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import type { Product } from '@/lib/types'
import { getQuadrant, getQuadrantColor, QUADRANTS } from '@/lib/types'

interface ProductCardProps {
  product: Product
  onClick?: () => void
  isSelected?: boolean
}

/**
 * Product card component with quadrant-based coloring
 */
export function ProductCard({ product, onClick, isSelected = false }: ProductCardProps) {
  const quadrant = getQuadrant(product.averageSafety, product.averageTaste)
  const color = getQuadrantColor(quadrant)

  const cardContent = (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{product.name}</h3>
            
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>Safety: {product.averageSafety.toFixed(0)}</span>
              <span>•</span>
              <span>Taste: {product.averageTaste.toFixed(0)}</span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className="text-xs"
                style={{ borderColor: color, color }}
              >
                {QUADRANTS[quadrant].name}
              </Badge>
              
              <span className="text-xs text-muted-foreground">
                {product.voteCount} {product.voteCount === 1 ? 'vote' : 'votes'}
              </span>
            </div>

            {product.avgPrice && (
              <div className="mt-2 text-xs text-muted-foreground">
                Price: {'$'.repeat(Math.round(product.avgPrice))}
              </div>
            )}
          </div>

          {/* Quadrant indicator dot */}
          <div
            className="w-6 h-6 rounded-full shrink-0"
            style={{ backgroundColor: color }}
            title={QUADRANTS[quadrant].description}
          />
        </div>

        {product.imageUrl && (
          <div className="mt-3">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-24 object-cover rounded"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <Link to="/product/$name" params={{ name: encodeURIComponent(product.name) }}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {cardContent}
      </motion.div>
    </Link>
  )
}
