import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { appConfig } from '@/lib/app-config'
import { useTranslation } from '@/hooks/use-translation'

interface SensitivityPickerProps {
  /** Set of allergen IDs the product is FREE FROM */
  selected: Set<string>
  /** Toggle an allergen on/off */
  onToggle: (id: string) => void
  disabled?: boolean
}

/**
 * Toggle buttons showing which allergens a product is FREE FROM.
 * AI-suggested selections are pre-filled; user reviews and adjusts.
 * Shows emoji + "X-free" label for clarity on what selection means.
 */
export function SensitivityPicker({ selected, onToggle, disabled = false }: SensitivityPickerProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('imageUpload.freeFrom')}>
        {appConfig.allergens.map((allergen) => {
          const isActive = selected.has(allergen.id)
          return (
            <motion.button
              key={allergen.id}
              type="button"
              onClick={() => !disabled && onToggle(allergen.id)}
              className={cn(
                'rounded-full font-medium flex items-center gap-1.5',
                'min-h-[36px] px-3 py-1.5 text-xs',
                'transition-colors',
                isActive
                  ? 'bg-safety-high/20 text-safety-high border-2 border-safety-high shadow-sm'
                  : 'bg-muted text-muted-foreground border border-border hover:bg-card',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
              whileTap={disabled ? undefined : { scale: 0.93 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              aria-pressed={isActive}
              disabled={disabled}
              title={allergen.description}
            >
              <span className="text-base leading-none">{allergen.emoji}</span>
              <span className="truncate">
                {t(`imageUpload.freeFromAllergen.${allergen.id}`)}
              </span>
              {isActive && <span className="text-safety-high">✓</span>}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
