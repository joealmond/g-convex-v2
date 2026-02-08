import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import type { Product } from '@/lib/types'
import { getQuadrant, getQuadrantColor, QUADRANTS } from '@/lib/types'
import { appConfig } from '@/lib/app-config'
import { DeleteProductButton } from './DeleteProductButton'
import { useAdmin } from '@/hooks/use-admin'
import { Trash2 } from 'lucide-react'

interface ProductCardProps {
  product: Product
  onClick?: () => void
  isSelected?: boolean
}

/**
 * Product card component with quadrant-based coloring
 */
export function ProductCard({ product, onClick, isSelected = false }: ProductCardProps) {
  const { isAdmin } = useAdmin()
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
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-sm truncate pr-2">{product.name}</h3>
              {isAdmin && (
                <div onClick={(e) => e.preventDefault()} className="shrink-0 ml-2">
                  <DeleteProductButton 
                    product={product} 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </DeleteProductButton>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>{appConfig.dimensions.axis1.label}: {product.averageSafety.toFixed(0)}</span>
              <span>•</span>
              <span>{appConfig.dimensions.axis2.label}: {product.averageTaste.toFixed(0)}</span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className="text-xs"
                style={{ borderColor: color, color }}
              >
                {QUADRANTS[quadrant]?.name || 'Unknown'}
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
            title={QUADRANTS[quadrant]?.description || ''}
          />
        </div>

        {product.imageUrl && !product.imageUrl.startsWith('blob:') && (
          <div className="mt-3">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-32 object-contain rounded bg-muted p-2"
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
