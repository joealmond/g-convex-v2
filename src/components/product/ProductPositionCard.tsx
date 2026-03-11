import { type ReactNode, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { appConfig } from '@/lib/app-config'
import { getPriceLabel, getQuadrant, type Quadrant } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/use-translation'

type ProductPositionMode = 'vibe' | 'value'

const QUADRANT_LABEL_POSITIONS = {
  topLeft: { x: 82, y: 86 },
  topRight: { x: 198, y: 86 },
  bottomLeft: { x: 82, y: 198 },
  bottomRight: { x: 198, y: 198 },
} as const

interface ProductPositionCardProps {
  averageSafety: number
  averageTaste: number
  avgPrice?: number | null
  action?: ReactNode
}

function buildPoint(horizontalScore: number, verticalScore: number) {
  const x = 24 + (horizontalScore / 100) * 232
  const y = 24 + ((100 - verticalScore) / 100) * 232
  return { x, y }
}

export function ProductPositionCard({
  averageSafety,
  averageTaste,
  avgPrice,
  action,
}: ProductPositionCardProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<ProductPositionMode>('vibe')

  const hasPrice = avgPrice !== undefined && avgPrice !== null
  const normalizedPrice = hasPrice ? (avgPrice / 5) * 100 : null
  const verticalScore = mode === 'vibe' ? averageSafety : normalizedPrice ?? 50
  const horizontalScore = averageTaste
  const quadrantMap = mode === 'vibe' ? appConfig.quadrants : appConfig.valueLens.quadrants
  const currentQuadrant = getQuadrant(verticalScore, horizontalScore)
  const quadrantInfo = quadrantMap[currentQuadrant as Quadrant]
  const axisYLabel = mode === 'vibe' ? appConfig.dimensions.axis1.label : appConfig.valueLens.axis1Label
  const axisXLabel = mode === 'vibe' ? appConfig.dimensions.axis2.label : appConfig.valueLens.axis2Label
  const point = buildPoint(horizontalScore, verticalScore)

  const secondaryValue =
    mode === 'vibe'
      ? `${Math.round(averageSafety)}/100`
      : hasPrice && normalizedPrice !== null
        ? `${getPriceLabel(normalizedPrice)} · ${avgPrice?.toFixed(1)}/5`
        : t('product.priceNotRated')

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {hasPrice ? (
          <div className="inline-flex rounded-full border border-border bg-muted/50 p-1">
            <Button
              type="button"
              variant={mode === 'vibe' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-full px-4"
              onClick={() => setMode('vibe')}
            >
              {t('chart.vibe')}
            </Button>
            <Button
              type="button"
              variant={mode === 'value' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-full px-4"
              onClick={() => setMode('value')}
            >
              {t('chart.value')}
            </Button>
          </div>
        ) : <div />}
        {action}
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-[1.75rem] border border-border bg-card p-3 shadow-sm sm:p-4">
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[1.25rem] border border-border/80 bg-background p-3">
          <svg viewBox="0 0 280 280" className="block aspect-square h-auto max-h-full w-full max-w-[28rem]" role="img" aria-label={t('product.positionOnMatrix')}>
            <rect x="24" y="24" width="116" height="116" fill={quadrantMap.topLeft.color} fillOpacity="0.12" rx="16" />
            <rect x="140" y="24" width="116" height="116" fill={quadrantMap.topRight.color} fillOpacity="0.12" rx="16" />
            <rect x="24" y="140" width="116" height="116" fill={quadrantMap.bottomLeft.color} fillOpacity="0.12" rx="16" />
            <rect x="140" y="140" width="116" height="116" fill={quadrantMap.bottomRight.color} fillOpacity="0.12" rx="16" />

            <line x1="140" y1="24" x2="140" y2="256" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5" />
            <line x1="24" y1="140" x2="256" y2="140" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5" />

            {Object.entries(quadrantMap).map(([key, info]) => {
              const position = QUADRANT_LABEL_POSITIONS[key as keyof typeof QUADRANT_LABEL_POSITIONS]
              return (
                <g key={key}>
                  <text x={position.x} y={position.y - 10} textAnchor="middle" fontSize="18">
                    {info.emoji}
                  </text>
                  <text
                    x={position.x}
                    y={position.y + 8}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="currentColor"
                  >
                    {info.label}
                  </text>
                </g>
              )
            })}

            <circle cx={point.x} cy={point.y} r="15" fill={quadrantInfo.color} fillOpacity="0.18" />
            <circle cx={point.x} cy={point.y} r="9" fill={quadrantInfo.color} />
            <circle cx={point.x} cy={point.y} r="4" fill="#FFFFFF" />
          </svg>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground sm:text-xs">
          <span>{axisYLabel}</span>
          <span>{axisXLabel}</span>
        </div>
      </div>

      <div
        className="rounded-2xl border px-3 py-3 sm:px-4"
        style={{
          borderColor: `${quadrantInfo.color}44`,
          backgroundColor: `${quadrantInfo.color}12`,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {quadrantInfo.emoji} {quadrantInfo.label}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{quadrantInfo.description}</p>
          </div>
          <Badge
            className={cn('shrink-0 text-white', mode === 'value' && !hasPrice && 'opacity-70')}
            style={{ backgroundColor: quadrantInfo.color }}
          >
            {mode === 'vibe' ? `${Math.round(averageTaste)}/100` : secondaryValue}
          </Badge>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{appConfig.dimensions.axis2.label}: {Math.round(averageTaste)}/100</span>
          <span>•</span>
          <span>{axisYLabel}: {secondaryValue}</span>
        </div>
      </div>
    </div>
  )
}
