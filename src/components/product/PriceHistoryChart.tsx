/**
 * Price History Chart Component
 * Line chart showing price changes over time
 */

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/use-translation'
import { appConfig } from '@/lib/app-config'
import { motion } from 'framer-motion'

interface PriceHistoryChartProps {
  productId: Id<'products'>
}

export function PriceHistoryChart({ productId }: PriceHistoryChartProps) {
  const { t } = useTranslation()
  const [timeRange, setTimeRange] = useState<30 | 90 | 365>(90)
  const [mounted, setMounted] = useState(false)
  
  const history = useQuery(api.products.getPriceHistory, { 
    productId,
    days: timeRange,
  })

  // Prevent SSR/hydration issues
  useState(() => {
    setMounted(true)
  })

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('priceHistory.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {t('common.loading')}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('priceHistory.title')}</CardTitle>
          <CardDescription>{t('priceHistory.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {t('priceHistory.noData')}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Prepare chart data
  const chartData = history
    .reverse() // Oldest first
    .map((snapshot) => ({
      date: new Date(snapshot.snapshotDate).toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric' 
      }),
      price: snapshot.price,
      fullDate: snapshot.snapshotDate,
    }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload
    const pricePreset = appConfig.dimensions.axis3.presets.find(
      p => Math.abs(p.value / 20 - data.price) < 0.5 // Map 1-5 to closest preset
    )

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background border border-border rounded-lg shadow-lg p-3"
      >
        <p className="text-sm font-medium">{data.fullDate}</p>
        <p className="text-lg font-bold flex items-center gap-2">
          {pricePreset?.emoji} {pricePreset?.label ?? `${'$'.repeat(Math.round(data.price))}`}
        </p>
        <p className="text-xs text-muted-foreground">{t('priceHistory.value')}: {data.price.toFixed(1)}</p>
      </motion.div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{t('priceHistory.title')}</CardTitle>
            <CardDescription>{t('priceHistory.description')}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timeRange === 30 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(30)}
            >
              {t('priceHistory.timeRange30d')}
            </Button>
            <Button
              variant={timeRange === 90 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(90)}
            >
              {t('priceHistory.timeRange90d')}
            </Button>
            <Button
              variant={timeRange === 365 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(365)}
            >
              {t('priceHistory.timeRange1y')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-sm"
              tick={{ fill: 'var(--muted-foreground)' }}
            />
            <YAxis 
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              className="text-sm"
              tick={{ fill: 'var(--muted-foreground)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ fill: 'var(--primary)', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
