import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { appConfig } from '@/lib/app-config'
import { useTranslation } from '@/hooks/use-translation'
import { AlertTriangle } from 'lucide-react'

interface SensitivityFilterChipsProps {
  /** Set of active allergen IDs to exclude (e.g. 'gluten', 'nuts') */
  activeFilters: Set<string>
  /** Toggle an allergen filter on/off */
  onToggle: (id: string) => void
  /** Whether the shared needs-review filter is active */
  showNeedsReviewOnly?: boolean
  /** Toggle the shared needs-review filter */
  onToggleNeedsReviewOnly?: () => void
}

/**
 * Multi-select emoji-based allergen filter chips.
 * One chip per allergen defined in appConfig.allergens.
 * Wraps to multiple lines on narrow screens.
 */
export function SensitivityFilterChips({
  activeFilters,
  onToggle,
  showNeedsReviewOnly = false,
  onToggleNeedsReviewOnly,
}: SensitivityFilterChipsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label={t('feed.sensitivityFilters')}>
      {onToggleNeedsReviewOnly ? (
        <motion.button
          type="button"
          onClick={onToggleNeedsReviewOnly}
          className={cn(
            'rounded-full font-medium flex items-center justify-center',
            'min-h-[32px] min-w-[32px] px-1.5 text-[15px] md:min-h-[34px] md:min-w-[34px] md:px-2 md:text-base',
            showNeedsReviewOnly
              ? 'border border-red-500/60 bg-orange-300 text-red-700 shadow-sm'
              : 'border border-orange-300 bg-orange-200/90 text-red-600 hover:bg-orange-300/90'
          )}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          aria-label={t('feed.needsReview')}
          aria-pressed={showNeedsReviewOnly}
          title={t('feed.needsReview')}
        >
          <AlertTriangle className="h-4 w-4" />
        </motion.button>
      ) : null}

      {appConfig.allergens.map((allergen) => {
        const isActive = activeFilters.has(allergen.id)
        return (
          <motion.button
            key={allergen.id}
            type="button"
            onClick={() => onToggle(allergen.id)}
            className={cn(
              'rounded-full font-medium flex items-center justify-center',
              'min-h-[32px] min-w-[32px] px-1.5 text-[15px] md:min-h-[34px] md:min-w-[34px] md:px-2 md:text-base',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground border border-border hover:bg-card'
            )}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            aria-label={allergen.label}
            aria-pressed={isActive}
            title={allergen.label}
          >
            <span className="leading-none">{allergen.emoji}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
