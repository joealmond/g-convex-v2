import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { appConfig } from '@/lib/app-config'
import { useTranslation } from '@/hooks/use-translation'

interface SensitivityFilterChipsProps {
  /** Set of active dietary restriction IDs (e.g. 'celiac', 'nut') */
  activeFilters: Set<string>
  /** Toggle a sensitivity filter on/off */
  onToggle: (id: string) => void
}

/**
 * Multi-select emoji-based sensitivity filter chips.
 * One chip per dietary restriction defined in appConfig.
 * Wraps to multiple lines on narrow screens.
 */
export function SensitivityFilterChips({ activeFilters, onToggle }: SensitivityFilterChipsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('feed.sensitivityFilters')}>
      {appConfig.dietaryRestrictions.map((restriction) => {
        const isActive = activeFilters.has(restriction.id)
        return (
          <motion.button
            key={restriction.id}
            onClick={() => onToggle(restriction.id)}
            className={cn(
              'rounded-full font-medium flex items-center justify-center',
              'min-h-[36px] min-w-[36px] px-2 text-lg',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground border border-border hover:bg-card'
            )}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            aria-label={restriction.label}
            aria-pressed={isActive}
            title={restriction.label}
          >
            <span className="leading-none">{restriction.emoji}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
