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
          <p className="mb-2">No votes yet</p>
          <p className="text-sm">Be the first to vote!</p>
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
      return '#7CB342' // Highlight color (primary green)
    }
    if (vote.isImpersonated) {
      return '#F1C40F' // Gold for impersonated
    }
    if (vote.isRegistered) {
      return '#27AE60' // Green for registered users
    }
    return '#95A5A6' // Gray for anonymous
  }

  return (
    <div className="w-full aspect-square">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
          
          <XAxis
            type="number"
            dataKey="safety"
            name="Safety"
            unit="%"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            label={{
              value: t('dimensions.axis1.label'),
              position: 'insideBottom',
              offset: -10,
              style: { fontSize: 14, fill: '#666' },
            }}
            stroke="#666"
          />
          
          <YAxis
            type="number"
            dataKey="taste"
            name="Taste"
            unit="%"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            label={{
              value: t('dimensions.axis2.label'),
              angle: -90,
              position: 'insideLeft',
              offset: 0,
              style: { fontSize: 14, fill: '#666' },
            }}
            stroke="#666"
          />
          
          {/* Reference lines for quadrants */}
          <ReferenceLine
            x={50}
            stroke="#999"
            strokeDasharray="5 5"
            strokeWidth={1}
          />
          <ReferenceLine
            y={50}
            stroke="#999"
            strokeDasharray="5 5"
            strokeWidth={1}
          />
          
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ payload }) => {
              if (!payload || payload.length === 0) return null
              const vote = payload[0].payload
              return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                  <p className="font-semibold mb-1">
                    {vote.isRegistered ? 'Registered User' : 'Anonymous'}
                  </p>
                  <p className="text-sm">
                    Safety: {vote.safety}
                  </p>
                  <p className="text-sm">
                    Taste: {vote.taste}
                  </p>
                  {vote.price && (
                    <p className="text-sm">Price: {vote.price}/5</p>
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
          
          <Scatter data={data} fill="#27AE60">
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getVoteColor(entry)}
                r={highlightVoteId === entry.id ? 8 : 6}
                stroke={highlightVoteId === entry.id ? '#558B2F' : 'none'}
                strokeWidth={highlightVoteId === entry.id ? 2 : 0}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-[#27AE60]" />
          <span>Registered</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-[#95A5A6]" />
          <span>Anonymous</span>
        </div>
        {data.some((v) => v.isImpersonated) && (
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-[#F1C40F]" />
            <span>Impersonated</span>
          </div>
        )}
      </div>
    </div>
  )
}
