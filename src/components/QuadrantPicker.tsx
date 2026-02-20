import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { appConfig } from '@/lib/app-config'

/** Quadrant preset values: safety, taste score pairs for each quadrant */
const QUADRANT_PRESETS = [
  { key: 'topLeft' as const, s: 90, t: 30 },
  { key: 'topRight' as const, s: 90, t: 90 },
  { key: 'bottomLeft' as const, s: 10, t: 10 },
  { key: 'bottomRight' as const, s: 30, t: 90 },
]

interface QuadrantPickerProps {
  /** Called with (safety, taste) when a quadrant button is pressed */
  onSelect: (safety: number, taste: number) => void
  disabled?: boolean
  /** Button height class (default: "h-12") */
  height?: string
  /** Text size class (default: "text-xs") */
  textSize?: string
  /** Grid gap class (default: "gap-1.5") */
  gap?: string
  /** Whether to show sub-labels (e.g., "Safe & Meh") under quadrant name */
  subLabels?: Record<string, string>
}

/**
 * Reusable 2×2 quadrant button grid.
 * Each button shows the quadrant emoji + label, colored by appConfig.
 */
export function QuadrantPicker({
  onSelect,
  disabled = false,
  height = 'h-12',
  textSize = 'text-xs',
  gap = 'gap-1.5',
  subLabels,
}: QuadrantPickerProps) {
  return (
    <div className={`grid grid-cols-2 ${gap}`}>
      {QUADRANT_PRESETS.map(({ key, s, t }) => {
        const q = appConfig.quadrants[key]
        return (
          <motion.div key={key} whileTap={{ scale: disabled ? 1 : 0.97 }}>
            <Button
              className={`w-full ${height} text-white hover:opacity-90 ${textSize} font-semibold`}
              style={{ backgroundColor: q.color }}
              onClick={() => onSelect(s, t)}
              disabled={disabled}
            >
              <div className="text-center">
                <div>
                  {q.emoji} {q.label}
                </div>
                {subLabels?.[key] && (
                  <div className="text-[10px] opacity-80">{subLabels[key]}</div>
                )}
              </div>
            </Button>
          </motion.div>
        )
      })}
    </div>
  )
}
