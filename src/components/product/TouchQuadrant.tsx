import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { getQuadrant, getQuadrantColor, QUADRANTS } from '@/lib/types'
import { useTranslation } from '@/hooks/use-translation'
import { appConfig } from '@/lib/app-config'

interface TouchQuadrantProps {
  /** Called whenever the user moves the dot */
  onValueChange: (safety: number, taste: number) => void
  /** Current safety value (controlled) */
  initialSafety?: number
  /** Current taste value (controlled) */
  initialTaste?: number
  disabled?: boolean
}

/**
 * Compact 2D touch-interactive quadrant for rating during product creation.
 * User taps or drags a dot to set safety (Y) and taste (X) values.
 * Fully controlled — parent owns safety/taste state via onValueChange.
 */
export function TouchQuadrant({
  onValueChange,
  initialSafety = 50,
  initialTaste = 50,
  disabled = false,
}: TouchQuadrantProps) {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const gridRef = useRef<SVGSVGElement>(null)

  // Use parent-provided values directly (fully controlled)
  const safety = initialSafety
  const taste = initialTaste

  const gridSize = 300
  const dotRadius = 14

  const getCoords = (safetyVal: number, tasteVal: number) => ({
    x: (tasteVal / 100) * gridSize,
    y: gridSize - (safetyVal / 100) * gridSize,
  })

  const getValues = (x: number, y: number) => ({
    safety: Math.max(0, Math.min(100, Math.round(((gridSize - y) / gridSize) * 100))),
    taste: Math.max(0, Math.min(100, Math.round((x / gridSize) * 100))),
  })

  const updatePosition = useCallback((e: React.PointerEvent) => {
    if (!gridRef.current) return
    const rect = gridRef.current.getBoundingClientRect()
    const scaleX = gridSize / rect.width
    const scaleY = gridSize / rect.height
    const svgX = (e.clientX - rect.left) * scaleX
    const svgY = (e.clientY - rect.top) * scaleY
    const values = getValues(svgX, svgY)
    onValueChange(values.safety, values.taste)
  }, [onValueChange])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return
    setIsDragging(true)
    setHasInteracted(true)
    updatePosition(e)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || disabled) return
    updatePosition(e)
  }

  const handlePointerUp = () => {
    if (!isDragging) return
    setIsDragging(false)
  }

  const coords = getCoords(safety, taste)
  const quadrant = getQuadrant(safety, taste)
  const dotColor = getQuadrantColor(quadrant)

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Instruction hint */}
      {!hasInteracted && (
        <p className="text-xs text-muted-foreground animate-pulse">
          👆 {t('imageUpload.touchToRate')}
        </p>
      )}

      <div className="relative w-full max-w-[280px]">
        {/* Axis labels outside SVG */}
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-muted-foreground font-medium whitespace-nowrap">
          ↑ {appConfig.dimensions.axis1.label}
        </div>
        <div className="absolute bottom-[-18px] left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground font-medium">
          {appConfig.dimensions.axis2.label} →
        </div>

        <svg
          ref={gridRef}
          viewBox={`0 0 ${gridSize} ${gridSize}`}
          className="w-full ml-2 border border-border rounded-xl bg-card cursor-crosshair touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Quadrant backgrounds */}
          {(
            [
              { key: 'topLeft', x: 0, y: 0 },
              { key: 'topRight', x: gridSize / 2, y: 0 },
              { key: 'bottomLeft', x: 0, y: gridSize / 2 },
              { key: 'bottomRight', x: gridSize / 2, y: gridSize / 2 },
            ] as const
          ).map(({ key, x, y }) => (
            <rect
              key={key}
              x={x}
              y={y}
              width={gridSize / 2}
              height={gridSize / 2}
              fill={QUADRANTS[key]?.color || '#ccc'}
              fillOpacity={0.12}
            />
          ))}

          {/* Quadrant labels */}
          {(
            [
              { key: 'topLeft', x: gridSize / 4, y: gridSize / 4 },
              { key: 'topRight', x: (gridSize / 4) * 3, y: gridSize / 4 },
              { key: 'bottomLeft', x: gridSize / 4, y: (gridSize / 4) * 3 },
              { key: 'bottomRight', x: (gridSize / 4) * 3, y: (gridSize / 4) * 3 },
            ] as const
          ).map(({ key, x, y }) => {
            const q = appConfig.quadrants[key]
            return (
              <text
                key={key}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fill={q.color}
                fontWeight="600"
                opacity={0.7}
              >
                {q.emoji} {q.label}
              </text>
            )
          })}

          {/* Center grid lines */}
          <line
            x1={gridSize / 2} y1={0} x2={gridSize / 2} y2={gridSize}
            stroke="var(--border)" strokeWidth={1.5} opacity={0.5}
          />
          <line
            x1={0} y1={gridSize / 2} x2={gridSize} y2={gridSize / 2}
            stroke="var(--border)" strokeWidth={1.5} opacity={0.5}
          />

          {/* Crosshair while dragging */}
          {isDragging && (
            <>
              <line
                x1={coords.x} y1={0} x2={coords.x} y2={gridSize}
                stroke="var(--foreground)" strokeWidth={0.5} opacity={0.3}
                strokeDasharray="3 3"
              />
              <line
                x1={0} y1={coords.y} x2={gridSize} y2={coords.y}
                stroke="var(--foreground)" strokeWidth={0.5} opacity={0.3}
                strokeDasharray="3 3"
              />
            </>
          )}

          {/* Draggable dot */}
          <motion.circle
            cx={coords.x}
            cy={coords.y}
            r={dotRadius}
            fill={dotColor}
            stroke="white"
            strokeWidth={3}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
              scale: isDragging ? 1.3 : 1,
              opacity: disabled ? 0.4 : 1,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="drop-shadow-lg"
          />
        </svg>
      </div>

      {/* Value readout */}
      <div className="flex items-center gap-3 text-xs mt-1">
        <span className="text-muted-foreground">
          {t('voting.safety')}: <span className="font-semibold text-foreground">{safety}</span>
        </span>
        <span className="text-muted-foreground">
          {t('voting.taste')}: <span className="font-semibold text-foreground">{taste}</span>
        </span>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: dotColor }}
        >
          {QUADRANTS[quadrant]?.name || ''}
        </span>
      </div>
    </div>
  )
}
