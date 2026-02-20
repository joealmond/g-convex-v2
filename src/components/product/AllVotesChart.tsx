import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

  if (!votes || votes.length === 0) {
    return (
      <div className="aspect-square w-full flex items-center justify-center text-muted-foreground">
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
    safety: vote.safety,
    taste: vote.taste,
    isRegistered: !vote.isAnonymous,
    isImpersonated: false, // TODO: Add impersonation detection logic
    isCurrentUser:
      (user && vote.userId === user._id) ||
      (!vote.isAnonymous && vote.userId === user?._id),
    storeName: vote.storeName,
    price: vote.price,
  }))

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

  return (
    <div className="w-full aspect-square">
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
          
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ payload }) => {
              if (!payload || payload.length === 0) return null
              const vote = payload[0].payload
              return (
                <div className="bg-card p-3 rounded-lg shadow-lg border border-border">
                  <p className="font-semibold mb-1">
                    {vote.isRegistered ? t('chart.registeredUser') : t('chart.anonymous')}
                  </p>
                  <p className="text-sm">
                    {t('voting.safety')}: {vote.safety}
                  </p>
                  <p className="text-sm">
                    {t('voting.taste')}: {vote.taste}
                  </p>
                  {vote.price && (
                    <p className="text-sm">{t('voting.price')}: {vote.price}/5</p>
                  )}
                  {vote.storeName && (
                    <p className="text-sm text-muted-foreground">
                      {vote.storeName}
                    </p>
                  )}
                </div>
              )
            }}
          />
          
          <Scatter data={data} fill={chartColors.safetyHigh}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getVoteColor(entry)}
                r={highlightVoteId === entry.id ? 8 : 6}
                stroke={highlightVoteId === entry.id ? chartColors.primaryDark : 'none'}
                strokeWidth={highlightVoteId === entry.id ? 2 : 0}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
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
