import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceArea, ReferenceLine } from 'recharts'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import type { Product } from '@/lib/types'
import { getQuadrant, getQuadrantColor, QUADRANTS } from '@/lib/types'
import { appConfig } from '@/lib/app-config'
import { hashStringToColor } from '@/lib/utils'

interface MatrixChartProps {
  products: Product[]
  onProductClick?: (product: Product) => void
  selectedProduct?: Product | null
  mode?: 'vibe' | 'value'
}

interface ChartDataPoint {
  product: Product
  x: number
  y: number
  z: number
}

/**
 * Spread overlapping data points by adding small offsets.
 * Groups points within a proximity threshold and arranges them
 * in a circular pattern around their shared center.
 */
function jitterOverlapping(points: ChartDataPoint[], threshold = 3, spread = 3): ChartDataPoint[] {
  const used = new Set<number>()
  const result: ChartDataPoint[] = []

  for (let i = 0; i < points.length; i++) {
    if (used.has(i)) continue
    const group = [i]
    used.add(i)

    // Find nearby points
    for (let j = i + 1; j < points.length; j++) {
      if (used.has(j)) continue
      const pi = points[i]!
      const pj = points[j]!
      if (Math.abs(pi.x - pj.x) < threshold && Math.abs(pi.y - pj.y) < threshold) {
        group.push(j)
        used.add(j)
      }
    }

    if (group.length === 1) {
      result.push(points[i]!)
    } else {
      // Arrange in circle around centroid
      const cx = group.reduce((s, idx) => s + points[idx]!.x, 0) / group.length
      const cy = group.reduce((s, idx) => s + points[idx]!.y, 0) / group.length
      group.forEach((idx, k) => {
        const angle = (2 * Math.PI * k) / group.length
        const r = spread * Math.min(group.length, 5) / 3
        result.push({
          ...points[idx]!,
          x: Math.max(0, Math.min(100, cx + r * Math.cos(angle))),
          y: Math.max(0, Math.min(100, cy + r * Math.sin(angle))),
        })
      })
    }
  }
  return result
}

/**
 * G-Matrix visualization component
 * Supports two modes:
 * - Vibe: safety (Y) × taste (X) — default G-Matrix
 * - Value: price (Y) × taste (X) — value-for-money lens
 */
export function MatrixChart({ products, onProductClick, selectedProduct, mode = 'vibe' }: MatrixChartProps) {
  // Build raw data points
  const rawData: ChartDataPoint[] = products.map((product) => ({
    product,
    x: product.averageTaste,
    y: mode === 'vibe' ? product.averageSafety : (product.avgPrice || 50),
    z: Math.max(product.voteCount, 5),
  }))

  // Jitter overlapping dots so they don't stack
  const data = jitterOverlapping(rawData)
  
  const yAxisLabel = mode === 'vibe' 
    ? appConfig.dimensions.axis1.label
    : appConfig.valueLens.axis1Label
  const xAxisLabel = mode === 'vibe'
    ? appConfig.dimensions.axis2.label
    : appConfig.valueLens.axis2Label
  
  const quadrantConfig = mode === 'vibe' 
    ? appConfig.quadrants 
    : appConfig.valueLens.quadrants

  interface TooltipPayload {
    payload: ChartDataPoint
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
    if (active && payload && payload.length > 0) {
      const firstPayload = payload[0]
      if (!firstPayload) return null
      const data = firstPayload.payload as ChartDataPoint
      const product = data.product
      
      const showQuadrant = mode === 'vibe'
      const quadrant = showQuadrant ? getQuadrant(product.averageSafety, product.averageTaste) : null

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-lg p-3 shadow-lg max-w-[200px]"
        >
          <p className="font-semibold text-sm truncate">{product.name}</p>
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            {mode === 'vibe' ? (
              <>
                <p>{appConfig.dimensions.axis1.label}: {product.averageSafety.toFixed(0)}</p>
                <p>{appConfig.dimensions.axis2.label}: {product.averageTaste.toFixed(0)}</p>
              </>
            ) : (
              <>
                <p>{appConfig.valueLens.axis1Label}: {(product.avgPrice || 50).toFixed(0)}</p>
                <p>{appConfig.valueLens.axis2Label}: {product.averageTaste.toFixed(0)}</p>
              </>
            )}
            <p>Votes: {product.voteCount}</p>
            {showQuadrant && quadrant && (
              <p className="text-xs font-medium" style={{ color: getQuadrantColor(quadrant) }}>
                {QUADRANTS[quadrant]?.name || 'Unknown'}
              </p>
            )}
          </div>
        </motion.div>
      )
    }
    return null
  }

  // Defer chart rendering until container has non-zero dimensions
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerReady, setContainerReady] = useState(false)
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setContainerReady(true)
        }
      }
    })
    observer.observe(containerRef.current)
    // Check immediately in case already sized
    const rect = containerRef.current.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) setContainerReady(true)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="w-full h-full flex flex-col">
      {/* Quadrant Legend — compact row above the chart */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-2 px-1">
        {[
          { key: 'topRight', q: quadrantConfig.topRight },
          { key: 'topLeft', q: quadrantConfig.topLeft },
          { key: 'bottomRight', q: quadrantConfig.bottomRight },
          { key: 'bottomLeft', q: quadrantConfig.bottomLeft },
        ].map(({ key, q }) => (
          <div key={key} className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-sm inline-block"
              style={{ backgroundColor: q.color, opacity: 0.7 }}
            />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {q.emoji} {q.label}
            </span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div ref={containerRef} className="flex-1 min-h-0 relative">
        {!containerReady ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%" minHeight={250}>
          <ScatterChart
            margin={{ top: 8, right: 12, bottom: 24, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            
            {/* Quadrant background fills */}
            <ReferenceArea x1={0} x2={50} y1={50} y2={100} fill={quadrantConfig.topLeft.color} fillOpacity={0.12} />
            <ReferenceArea x1={50} x2={100} y1={50} y2={100} fill={quadrantConfig.topRight.color} fillOpacity={0.12} />
            <ReferenceArea x1={0} x2={50} y1={0} y2={50} fill={quadrantConfig.bottomLeft.color} fillOpacity={0.12} />
            <ReferenceArea x1={50} x2={100} y1={0} y2={50} fill={quadrantConfig.bottomRight.color} fillOpacity={0.12} />

            {/* Center crosshair lines */}
            <ReferenceLine x={50} stroke="var(--border)" strokeWidth={1.5} strokeDasharray="6 3" />
            <ReferenceLine y={50} stroke="var(--border)" strokeWidth={1.5} strokeDasharray="6 3" />

            <XAxis
              type="number"
              dataKey="x"
              name={xAxisLabel}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              label={{ value: `${xAxisLabel} →`, position: 'bottom', offset: 4, fontSize: 11, fill: 'var(--muted-foreground)' }}
              stroke="var(--border)"
              axisLine={{ strokeWidth: 1.5 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yAxisLabel}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              label={{ value: `↑ ${yAxisLabel}`, angle: -90, position: 'left', offset: -4, fontSize: 11, fill: 'var(--muted-foreground)' }}
              stroke="var(--border)"
              axisLine={{ strokeWidth: 1.5 }}
              width={28}
            />
            <ZAxis type="number" dataKey="z" range={[40, 300]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

            <Scatter data={data} onClick={(data) => onProductClick?.(data.product)}>
              {data.map((entry, index) => {
                const productColor = hashStringToColor(entry.product.name)
                const isSelected = selectedProduct?._id === entry.product._id

                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={productColor}
                    fillOpacity={isSelected ? 1 : 0.75}
                    stroke={isSelected ? 'var(--foreground)' : '#fff'}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="cursor-pointer drop-shadow-sm"
                  />
                )
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
