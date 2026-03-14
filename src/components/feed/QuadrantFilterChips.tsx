import { appConfig } from '@/lib/app-config'
import type { Quadrant } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/use-translation'

interface QuadrantFilterChipsProps {
  selectedQuadrant: Quadrant | null
  onToggle: (value: Quadrant) => void
}

export function QuadrantFilterChips({ selectedQuadrant, onToggle }: QuadrantFilterChipsProps) {
  const { t } = useTranslation()

  const orderedQuadrants: Quadrant[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight']

  return (
    <div
      className="grid w-20 grid-cols-2 gap-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      role="group"
      aria-label={t('feed.quadrantFilter')}
    >
      {orderedQuadrants.map((quadrantKey) => {
        const quadrant = appConfig.quadrants[quadrantKey]
        const isActive = selectedQuadrant === quadrantKey
        return (
          <button
            key={quadrantKey}
            type="button"
            onClick={() => onToggle(quadrantKey)}
            aria-pressed={isActive}
            className={cn(
              'flex h-9 w-10 items-center justify-center border-r border-b text-sm leading-none transition-colors',
              quadrantKey === 'topRight' || quadrantKey === 'bottomRight' ? 'border-r-0' : '',
              quadrantKey === 'bottomLeft' || quadrantKey === 'bottomRight' ? 'border-b-0' : '',
              isActive ? 'text-white' : 'text-foreground/85 hover:brightness-95'
            )}
            style={isActive
              ? { backgroundColor: quadrant.color, borderColor: quadrant.color }
              : { backgroundColor: `${quadrant.color}1f`, borderColor: `${quadrant.color}30` }}
            title={quadrant.label}
          >
            <span className="text-base leading-none">{quadrant.emoji}</span>
          </button>
        )
      })}
    </div>
  )
}
