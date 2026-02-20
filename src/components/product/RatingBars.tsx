import { motion } from 'framer-motion'
import { appConfig } from '@/lib/app-config'
import { cn } from '@/lib/utils'

interface RatingBarsProps {
  safety: number
  taste: number
  price?: number
}

/**
 * Displays 3 horizontal rating bars for product scores
 * - axis1 (safety): 0-100
 * - axis2 (taste): 0-100
 * - axis3 (price): 0-100 (calculated from 1-5 scale)
 *
 * Each bar shows:
 * - Label (from config)
 * - Score value
 * - Color-coded progress bar
 * - Rating label (Excellent/Good/Fair/Poor)
 */
export function RatingBars({ safety, taste, price = 0 }: RatingBarsProps) {
  /**
   * Get rating label based on score
   */
  const getRatingLabel = (score: number): string => {
    for (const { min, label } of appConfig.ratingLabels) {
      if (score >= min) return label
    }
    return 'Poor'
  }

  /**
   * Get color for a score
   */
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-safety-high' // Green
    if (score >= 60) return 'bg-primary' // Sage green
    if (score >= 40) return 'bg-safety-mid' // Yellow
    return 'bg-safety-low' // Red
  }

  const scores = [
    { label: appConfig.dimensions.axis1.label, value: safety },
    { label: appConfig.dimensions.axis2.label, value: taste },
    { label: appConfig.dimensions.axis3.label, value: price },
  ]

  return (
    <div className="space-y-6">
      {scores.map((item, index) => (
        <div key={index} className="space-y-2">
          {/* Label + Value */}
          <div className="flex items-baseline justify-between">
            <h4 className="text-sm font-semibold text-foreground">{item.label}</h4>
            <span className="text-xs font-bold text-muted-foreground">
              {item.value.toFixed(0)}/100
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-background rounded-full overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', getScoreColor(item.value))}
              initial={{ width: 0 }}
              animate={{ width: `${item.value}%` }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
            />
          </div>

          {/* Rating Label */}
          <p className="text-xs text-muted-foreground">{getRatingLabel(item.value)}</p>
        </div>
      ))}
    </div>
  )
}
