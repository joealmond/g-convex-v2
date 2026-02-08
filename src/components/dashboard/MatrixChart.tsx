import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Rectangle } from 'recharts'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import type { Product } from '@/lib/types'
import { getQuadrant, getQuadrantColor, QUADRANTS } from '@/lib/types'
import { appConfig } from '@/lib/app-config'

interface MatrixChartProps {
  products: Product[]
  onProductClick?: (product: Product) => void
  selectedProduct?: Product | null
}

interface ChartDataPoint {
  product: Product
  x: number
  y: number
  z: number
}

/**
 * G-Matrix visualization component
 * 2D scatter chart with quadrant backgrounds
 */
export function MatrixChart({ products, onProductClick, selectedProduct }: MatrixChartProps) {
  // Transform products into chart data
  const data: ChartDataPoint[] = products.map((product) => ({
    product,
    x: product.averageTaste,
    y: product.averageSafety,
    z: Math.max(product.voteCount, 5), // Size based on votes, minimum 5 for visibility
  }))

  interface TooltipPayload {
    payload: ChartDataPoint
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
    if (active && payload && payload.length > 0) {
      const firstPayload = payload[0]
      if (!firstPayload) return null
      const data = firstPayload.payload as ChartDataPoint
      const product = data.product
      const quadrant = getQuadrant(product.averageSafety, product.averageTaste)

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-lg p-3 shadow-lg"
        >
          <p className="font-semibold text-sm">{product.name}</p>
          <div className="text-xs text-muted-foreground mt-1 space-y-1">
            <p>{appConfig.dimensions.axis1.label}: {product.averageSafety.toFixed(0)}</p>
            <p>{appConfig.dimensions.axis2.label}: {product.averageTaste.toFixed(0)}</p>
            <p>Votes: {product.voteCount}</p>
            <p className="text-xs font-medium" style={{ color: getQuadrantColor(quadrant) }}>
              {QUADRANTS[quadrant]?.name || 'Unknown'}
            </p>
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
            name={appConfig.dimensions.axis2.label}
            unit=""
            domain={[0, 100]}
            label={{ value: `${appConfig.dimensions.axis2.label} →`, position: 'bottom', offset: 0 }}
            stroke="hsl(var(--foreground))"
          />
          <YAxis
            type="number"
            dataKey="y"
            name={appConfig.dimensions.axis1.label}
            unit=""
            domain={[0, 100]}
            label={{ value: `↑ ${appConfig.dimensions.axis1.label}`, angle: -90, position: 'left' }}
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
              const color = getQuadrantColor(quadrant)
              const isSelected = selectedProduct?._id === entry.product._id

              return (
                <Cell
                  key={`cell-${index}`}
                  fill={color}
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
        {appConfig.quadrants.topLeft.label}
      </div>
      <div className="absolute top-4 right-4 text-xs font-medium opacity-50 pointer-events-none">
        {appConfig.quadrants.topRight.label}
      </div>
      <div className="absolute bottom-4 left-4 text-xs font-medium opacity-50 pointer-events-none">
        {appConfig.quadrants.bottomLeft.label}
      </div>
      <div className="absolute bottom-4 right-4 text-xs font-medium opacity-50 pointer-events-none">
        {appConfig.quadrants.bottomRight.label}
      </div>
    </div>
  )
}
