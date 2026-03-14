import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import type { Id } from '@convex/_generated/dataModel'
import { useTranslation } from '@/hooks/use-translation'
import { chartColors } from '@/lib/app-config'

interface AllVotesChartProps {
  productId: Id<'products'>
  highlightVoteId?: Id<'votes'> // Optional: highlight a specific vote (e.g., user's vote)
}

export function AllVotesChart({ productId, highlightVoteId }: AllVotesChartProps) {
  const { t } = useTranslation()
  const votes = useQuery(api.votes.getByProduct, { productId })
  const user = useQuery(api.users.current)
  const [selectedVoteId, setSelectedVoteId] = useState<Id<'votes'> | null>(null)
  const chartRootRef = useRef<HTMLDivElement>(null)

  if (!votes || votes.length === 0) {
    return (
      <div className="flex h-[14rem] w-full items-center justify-center text-muted-foreground sm:h-[18rem]">
        <div className="text-center">
          <p className="mb-2">{t('chart.noVotesYet')}</p>
          <p className="text-sm">{t('chart.beFirstToVote')}</p>
        </div>
      </div>
    )
  }

  // Prepare data for scatter chart
  const data = votes.map((vote) => ({
    id: vote._id,
    safety: vote.safety ?? 50,
    taste: vote.taste ?? 50,
    isRegistered: !vote.isAnonymous,
    isImpersonated: false, // TODO: Add impersonation detection logic
    isCurrentUser:
      (user && vote.userId === user._id) ||
      (!vote.isAnonymous && vote.userId === user?._id),
    storeName: vote.storeName,
    price: vote.price,
  }))

  const selectedVote = useMemo(
    () => data.find((vote) => vote.id === selectedVoteId) ?? null,
    [data, selectedVoteId]
  )

  // Color mapping
  const getVoteColor = (vote: (typeof data)[0]) => {
    if (highlightVoteId && vote.id === highlightVoteId) {
      return chartColors.primary // Highlight color (primary green)
    }
    if (vote.isImpersonated) {
      return chartColors.gold // Gold for impersonated
    }
    if (vote.isRegistered) {
      return chartColors.safetyHigh // Green for registered users
    }
    return chartColors.anonymous // Gray for anonymous
  }

  useEffect(() => {
    if (!selectedVote) return

    const handlePointerDown = (event: PointerEvent) => {
      const root = chartRootRef.current
      if (!root) return

      const target = event.target as HTMLElement | null
      if (!target || !root.contains(target)) return

      if (target.closest('[data-selected-vote-tooltip]')) return
      if (target.closest('.chart-click-dot')) return

      setSelectedVoteId(null)
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [selectedVote])

  return (
    <div
      ref={chartRootRef}
      className="relative h-[18rem] w-full sm:h-[22rem] lg:h-[24rem]"
    >
      {selectedVote && (
        <div
          data-selected-vote-tooltip
          className="absolute right-2 top-2 z-20 max-w-[220px] rounded-lg border border-border bg-card p-3 shadow-lg"
        >
          <p className="mb-1 text-sm font-semibold">
            {selectedVote.isRegistered ? t('chart.registeredUser') : t('chart.anonymous')}
          </p>
          <p className="text-sm">{t('voting.safety')}: {selectedVote.safety}</p>
          <p className="text-sm">{t('voting.taste')}: {selectedVote.taste}</p>
          {selectedVote.price && (
            <p className="text-sm">{t('voting.price')}: {selectedVote.price}/5</p>
          )}
          {selectedVote.storeName && (
            <p className="text-sm text-muted-foreground">{selectedVote.storeName}</p>
          )}
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
          
          <XAxis
            type="number"
            dataKey="safety"
            name={t('voting.safety')}
            unit="%"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            label={{
              value: t('dimensions.axis1.label'),
              position: 'insideBottom',
              offset: -10,
              style: { fontSize: 14, fill: chartColors.axisLabel },
            }}
            stroke={chartColors.axisLabel}
          />
          
          <YAxis
            type="number"
            dataKey="taste"
            name={t('voting.taste')}
            unit="%"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            label={{
              value: t('dimensions.axis2.label'),
              angle: -90,
              position: 'insideLeft',
              offset: 0,
              style: { fontSize: 14, fill: chartColors.axisLabel },
            }}
            stroke={chartColors.axisLabel}
          />
          
          {/* Reference lines for quadrants */}
          <ReferenceLine
            x={50}
            stroke={chartColors.anonymous}
            strokeDasharray="5 5"
            strokeWidth={1}
          />
          <ReferenceLine
            y={50}
            stroke={chartColors.anonymous}
            strokeDasharray="5 5"
            strokeWidth={1}
          />
          
          <Scatter
            data={data}
            fill={chartColors.safetyHigh}
            onClick={(entry) => setSelectedVoteId(entry.id)}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getVoteColor(entry)}
                r={highlightVoteId === entry.id ? 8 : 6}
                stroke={highlightVoteId === entry.id ? chartColors.primaryDark : 'none'}
                strokeWidth={highlightVoteId === entry.id ? 2 : 0}
                className="chart-click-dot cursor-pointer"
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full" style={{ background: chartColors.safetyHigh }} />
          <span>{t('chart.registered')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full" style={{ background: chartColors.anonymous }} />
          <span>{t('chart.anonymous')}</span>
        </div>
        {data.some((v) => v.isImpersonated) && (
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full" style={{ background: chartColors.gold }} />
            <span>{t('chart.impersonated')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
