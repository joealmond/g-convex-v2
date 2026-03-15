import { motion } from 'framer-motion'
import { appConfig } from '@/lib/app-config'
import {
  deriveAllergenConfidence,
  deriveSafetyDisplayState,
  SAFETY_REVIEW_VOTE_TARGET,
} from '@/lib/score-utils'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/use-translation'

interface RatingBarsProps {
  safety: number
  taste: number
  price?: number
  safetyVoteCount?: number
  /** If true, safety bar shows "(for you)" indicator */
  personalized?: boolean
}

/**
 * Displays 3 horizontal rating bars for product scores
 * - axis1 (safety): 0-100 — personalized or universal depending on user profile
 * - axis2 (taste): 0-100 — from thumbs up/down ratio
 * - axis3 (price): 0-100 (calculated from 1-5 scale)
 *
 * Each bar shows:
 * - Label (from config)
 * - Score value
 * - Color-coded progress bar
 * - Rating label (Excellent/Good/Fair/Poor)
 */
export function RatingBars({
  safety,
  taste,
  price = 0,
  safetyVoteCount = 0,
  personalized = false,
}: RatingBarsProps) {
  const { t } = useTranslation()
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
    {
      label: personalized
        ? `${appConfig.dimensions.axis1.label} — ${t('voting.safeForYou')}`
        : appConfig.dimensions.axis1.label,
      value: safety,
      state: deriveSafetyDisplayState(safety, safetyVoteCount),
      confidence: deriveAllergenConfidence(safetyVoteCount),
      isSafety: true,
    },
    { label: appConfig.dimensions.axis2.label, value: taste, isSafety: false },
    { label: appConfig.dimensions.axis3.label, value: price, isSafety: false },
  ]

  const getStateLabel = (state: 'likely-unsafe' | 'needs-review' | 'likely-safe', voteCount = 0) => {
    if (state === 'likely-safe') return t('voting.likelySafe')
    if (state === 'likely-unsafe') return t('voting.likelyUnsafe')
    return t('voting.needsReviewProgress', {
      current: Math.min(voteCount, SAFETY_REVIEW_VOTE_TARGET),
      target: SAFETY_REVIEW_VOTE_TARGET,
    })
  }

  const getStateBadgeClass = (state: 'likely-unsafe' | 'needs-review' | 'likely-safe') => {
    if (state === 'likely-safe') return 'border-safety-high/35 bg-safety-high/15 text-foreground'
    if (state === 'likely-unsafe') return 'border-safety-low/35 bg-safety-low/15 text-foreground'
    return 'border-safety-mid/45 bg-safety-mid/20 text-foreground'
  }

  const getConfidenceLabel = (confidence: 'low' | 'medium' | 'high') => {
    if (confidence === 'high') return t('voting.highConfidence')
    if (confidence === 'medium') return t('voting.mediumConfidence')
    return t('voting.lowConfidence')
  }

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

          {/* Rating Label / Safety State */}
          {item.isSafety && item.state && item.confidence ? (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={cn('rounded-full border px-2 py-0.5 font-medium', getStateBadgeClass(item.state))}>
                {getStateLabel(item.state, safetyVoteCount)}
              </span>
              <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-muted-foreground">
                {t('voting.confidence')}: {getConfidenceLabel(item.confidence)}
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{getRatingLabel(item.value)}</p>
          )}
        </div>
      ))}
    </div>
  )
}
