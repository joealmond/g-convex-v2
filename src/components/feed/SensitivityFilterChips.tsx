import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { appConfig } from '@/lib/app-config'
import { useTranslation } from '@/hooks/use-translation'

interface SensitivityFilterChipsProps {
  /** Set of active allergen IDs to exclude (e.g. 'gluten', 'nuts') */
  activeFilters: Set<string>
  /** Toggle an allergen filter on/off */
  onToggle: (id: string) => void
}

/**
 * Multi-select emoji-based allergen filter chips.
 * One chip per allergen defined in appConfig.allergens.
 * Wraps to multiple lines on narrow screens.
 */
export function SensitivityFilterChips({ activeFilters, onToggle }: SensitivityFilterChipsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('feed.sensitivityFilters')}>
      {appConfig.allergens.map((allergen) => {
        const isActive = activeFilters.has(allergen.id)
        return (
          <motion.button
            key={allergen.id}
            onClick={() => onToggle(allergen.id)}
            className={cn(
              'rounded-full font-medium flex items-center justify-center',
              'min-h-[36px] min-w-[36px] px-2 text-lg',
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
