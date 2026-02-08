import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Rectangle } from 'recharts'
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
  mode?: 'vibe' | 'value' // Chart mode: vibe (safety×taste) or value (price×taste)
}

interface ChartDataPoint {
  product: Product
  x: number
  y: number
  z: number
}

/**
 * G-Matrix visualization component
 * Supports two modes:
 * - Vibe: safety (Y) × taste (X) — default G-Matrix
 * - Value: price (Y) × taste (X) — value-for-money lens
 */
export function MatrixChart({ products, onProductClick, selectedProduct, mode = 'vibe' }: MatrixChartProps) {
  // Transform products into chart data based on mode
  const data: ChartDataPoint[] = products.map((product) => ({
    product,
    x: product.averageTaste, // X-axis is always taste
    y: mode === 'vibe' ? product.averageSafety : (product.averagePrice || 50), // Y-axis: safety or price
    z: Math.max(product.voteCount, 5), // Size based on votes, minimum 5 for visibility
  }))
  
  // Get axis labels based on mode
  const yAxisLabel = mode === 'vibe' 
    ? appConfig.dimensions.axis1.label // Safety
    : appConfig.valueLens.axis1Label // Price
  const xAxisLabel = mode === 'vibe'
    ? appConfig.dimensions.axis2.label // Taste
    : appConfig.valueLens.axis2Label // Taste (same in value mode)
  
  // Get quadrant config based on mode
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
      
      // In value mode, we don't show quadrant info (different logic needed)
      const showQuadrant = mode === 'vibe'
      const quadrant = showQuadrant ? getQuadrant(product.averageSafety, product.averageTaste) : null

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-lg p-3 shadow-lg"
        >
          <p className="font-semibold text-sm">{product.name}</p>
          <div className="text-xs text-muted-foreground mt-1 space-y-1">
            {mode === 'vibe' ? (
              <>
                <p>{appConfig.dimensions.axis1.label}: {product.averageSafety.toFixed(0)}</p>
                <p>{appConfig.dimensions.axis2.label}: {product.averageTaste.toFixed(0)}</p>
              </>
            ) : (
              <>
                <p>{appConfig.valueLens.axis1Label}: {(product.averagePrice || 50).toFixed(0)}</p>
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

  // Defer chart rendering until container has non-zero dimensions (avoids SSR/hydration -1 warning)
  const containerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {!mounted ? (
        <div className="flex items-center justify-center h-full">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
      <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={300}>
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            dataKey="x"
            name={xAxisLabel}
            unit=""
            domain={[0, 100]}
            label={{ value: `${xAxisLabel} →`, position: 'bottom', offset: 0 }}
            stroke="hsl(var(--foreground))"
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yAxisLabel}
            unit=""
            domain={[0, 100]}
            label={{ value: `↑ ${yAxisLabel}`, angle: -90, position: 'left' }}
            stroke="hsl(var(--foreground))"
          />
          <ZAxis type="number" dataKey="z" range={[50, 400]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          
          {/* Background quadrants */}
          <Rectangle />

          <Scatter
            data={data}
            onClick={(data) => onProductClick?.(data.product)}
          >
            {data.map((entry, index) => {
              const quadrant = getQuadrant(entry.y, entry.x)
              const productColor = hashStringToColor(entry.product.name) // Hash-based color
              const isSelected = selectedProduct?._id === entry.product._id

              return (
                <Cell
                  key={`cell-${index}`}
                  fill={productColor}
                  fillOpacity={isSelected ? 1 : 0.7}
                  stroke={isSelected ? 'hsl(var(--foreground))' : 'none'}
                  strokeWidth={isSelected ? 3 : 0}
                  className="cursor-pointer transition-all hover:opacity-100"
                />
              )
            })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      )}

      {/* Quadrant labels */}
      <div className="absolute top-4 left-4 text-xs font-medium opacity-50 pointer-events-none">
        {quadrantConfig.topLeft.label}
      </div>
      <div className="absolute top-4 right-4 text-xs font-medium opacity-50 pointer-events-none">
        {quadrantConfig.topRight.label}
      </div>
      <div className="absolute bottom-4 left-4 text-xs font-medium opacity-50 pointer-events-none">
        {quadrantConfig.bottomLeft.label}
      </div>
      <div className="absolute bottom-4 right-4 text-xs font-medium opacity-50 pointer-events-none">
        {quadrantConfig.bottomRight.label}
      </div>
    </div>
  )
}
