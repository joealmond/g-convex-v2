import { appConfig } from '@/lib/app-config'
import type { Quadrant } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/use-translation'

export type QuadrantFilterValue = 'all' | Quadrant

interface QuadrantFilterChipsProps {
  value: QuadrantFilterValue
  onChange: (value: QuadrantFilterValue) => void
}

export function QuadrantFilterChips({ value, onChange }: QuadrantFilterChipsProps) {
  const { t } = useTranslation()

  const options: Array<{
    value: QuadrantFilterValue
    label: string
    emoji?: string
    color?: string
  }> = [
    { value: 'all', label: t('feed.allQuadrants') },
    ...Object.entries(appConfig.quadrants).map(([key, quadrant]) => ({
      value: key as Quadrant,
      label: quadrant.label,
      emoji: quadrant.emoji,
      color: quadrant.color,
    })),
  ]

  return (
    <div className="flex flex-wrap gap-2" aria-label={t('feed.quadrantFilter')}>
      {options.map((option) => {
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex min-h-10 items-center gap-2 rounded-2xl border px-3 py-2 text-left text-xs font-medium transition-all sm:text-sm',
              option.color
                ? isActive
                  ? 'text-white shadow-sm'
                  : 'bg-card text-foreground hover:bg-muted/70'
                : isActive
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-foreground hover:bg-muted/70'
            )}
            style={option.color
              ? isActive
                ? { backgroundColor: option.color, borderColor: option.color }
                : { backgroundColor: `${option.color}10`, borderColor: `${option.color}35` }
              : undefined}
          >
            {option.emoji && <span className="text-sm">{option.emoji}</span>}
            <span className="truncate">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
