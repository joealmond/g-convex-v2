import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { getQuadrant, getQuadrantColor, QUADRANTS } from '@/lib/types'

interface CoordinateGridProps {
  onVote?: (safety: number, taste: number) => void
  initialSafety?: number
  initialTaste?: number
  disabled?: boolean
}

/**
 * Interactive coordinate grid for precise voting
 * User can drag a dot to select safety and taste values
 */
export function CoordinateGrid({
  onVote,
  initialSafety = 50,
  initialTaste = 50,
  disabled = false,
}: CoordinateGridProps) {
  const [safety, setSafety] = useState(initialSafety)
  const [taste, setTaste] = useState(initialTaste)
  const [isDragging, setIsDragging] = useState(false)
  const gridRef = useRef<SVGSVGElement>(null)

  const gridSize = 400
  const dotRadius = 12

  // Convert percentage to SVG coordinates
  const getCoords = (safetyVal: number, tasteVal: number) => {
    return {
      x: (tasteVal / 100) * gridSize,
      y: gridSize - (safetyVal / 100) * gridSize,
    }
  }

  // Convert SVG coordinates to percentage
  const getValues = (x: number, y: number) => {
    const safetyVal = Math.max(0, Math.min(100, ((gridSize - y) / gridSize) * 100))
    const tasteVal = Math.max(0, Math.min(100, (x / gridSize) * 100))
    return { safety: Math.round(safetyVal), taste: Math.round(tasteVal) }
  }

  // Handle pointer events
  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return
    setIsDragging(true)
    updatePosition(e)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || disabled) return
    updatePosition(e)
  }

  const handlePointerUp = () => {
    if (disabled || !isDragging) return
    setIsDragging(false)
    onVote?.(safety, taste)
  }

  const updatePosition = useCallback((e: React.PointerEvent) => {
    if (!gridRef.current) return

    const rect = gridRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Scale to SVG coordinates
    const scaleX = gridSize / rect.width
    const scaleY = gridSize / rect.height
    const svgX = x * scaleX
    const svgY = y * scaleY

    const values = getValues(svgX, svgY)
    setSafety(values.safety)
    setTaste(values.taste)
  }, [gridSize])

  const coords = getCoords(safety, taste)
  const quadrant = getQuadrant(safety, taste)
  const dotColor = getQuadrantColor(quadrant)

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        ref={gridRef}
        viewBox={`0 0 ${gridSize} ${gridSize}`}
        className="w-full max-w-md border border-border rounded-lg bg-card cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ userSelect: 'none' }}
      >
        {/* Quadrant backgrounds */}
        <rect
          x={0}
          y={0}
          width={gridSize / 2}
          height={gridSize / 2}
          fill={QUADRANTS.topLeft?.color || '#cccccc'}
          fillOpacity={0.7}
        />
        <rect
          x={gridSize / 2}
          y={0}
          width={gridSize / 2}
          height={gridSize / 2}
          fill={QUADRANTS.topRight?.color || '#cccccc'}
          fillOpacity={0.7}
        />
        <rect
          x={0}
          y={gridSize / 2}
          width={gridSize / 2}
          height={gridSize / 2}
          fill={QUADRANTS.bottomLeft?.color || '#cccccc'}
          fillOpacity={0.7}
        />
        <rect
          x={gridSize / 2}
          y={gridSize / 2}
          width={gridSize / 2}
          height={gridSize / 2}
          fill={QUADRANTS.bottomRight?.color || '#cccccc'}
          fillOpacity={0.7}
        />

        {/* Grid lines */}
        <line
          x1={gridSize / 2}
          y1={0}
          x2={gridSize / 2}
          y2={gridSize}
          stroke="var(--border)"
          strokeWidth={2}
        />
        <line
          x1={0}
          y1={gridSize / 2}
          x2={gridSize}
          y2={gridSize / 2}
          stroke="var(--border)"
          strokeWidth={2}
        />

        {/* Minor grid lines */}
        {[25, 75].map((percent) => (
          <g key={`grid-${percent}`}>
            <line
              x1={(percent / 100) * gridSize}
              y1={0}
              x2={(percent / 100) * gridSize}
              y2={gridSize}
              stroke="var(--border)"
              strokeWidth={1}
              opacity={0.3}
              strokeDasharray="4 4"
            />
            <line
              x1={0}
              y1={(percent / 100) * gridSize}
              x2={gridSize}
              y2={(percent / 100) * gridSize}
              stroke="var(--border)"
              strokeWidth={1}
              opacity={0.3}
              strokeDasharray="4 4"
            />
          </g>
        ))}

        {/* Draggable dot */}
        <motion.circle
          cx={coords.x}
          cy={coords.y}
          r={dotRadius}
          fill={dotColor}
          stroke="var(--foreground)"
          strokeWidth={2}
          initial={{ scale: 1, opacity: disabled ? 0.5 : 1 }}
          animate={{
            scale: isDragging ? 1.2 : 1,
            opacity: disabled ? 0.5 : 1,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="cursor-grab active:cursor-grabbing drop-shadow-md"
        />

        {/* Crosshair lines */}
        {isDragging && (
          <>
            <line
              x1={coords.x}
              y1={0}
              x2={coords.x}
              y2={gridSize}
              stroke="var(--foreground)"
              strokeWidth={1}
              opacity={0.3}
              strokeDasharray="2 2"
            />
            <line
              x1={0}
              y1={coords.y}
              x2={gridSize}
              y2={coords.y}
              stroke="var(--foreground)"
              strokeWidth={1}
              opacity={0.3}
              strokeDasharray="2 2"
            />
          </>
        )}

        {/* Axis labels */}
        <text
          x={gridSize / 2}
          y={gridSize - 5}
          textAnchor="middle"
          fontSize={12}
          fill="var(--muted-foreground)"
        >
          Taste →
        </text>
        <text
          x={10}
          y={gridSize / 2}
          textAnchor="start"
          fontSize={12}
          fill="var(--muted-foreground)"
          transform={`rotate(-90, 10, ${gridSize / 2})`}
        >
          ↑ Safety
        </text>
      </svg>

      {/* Value display */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Safety:</span>
          <span className="font-semibold">{safety}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Taste:</span>
          <span className="font-semibold">{taste}</span>
        </div>
        <div
          className="px-2 py-1 rounded text-xs font-medium"
          style={{ backgroundColor: dotColor, color: 'white' }}
        >
          {QUADRANTS[quadrant]?.name || 'Unknown'}
        </div>
      </div>
    </div>
  )
}
