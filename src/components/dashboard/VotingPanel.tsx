import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { SAFETY_PRESETS, TASTE_PRESETS } from '@/lib/types'
import { appConfig } from '@/lib/app-config'

interface VotingPanelProps {
  onVote: (safety: number, taste: number) => void
  disabled?: boolean
}

/**
 * Quick vote panel with preset buttons for safety and taste
 * Allows users to quickly vote without precise input
 */
export function VotingPanel({ onVote, disabled = false }: VotingPanelProps) {
  const handlePresetVote = (safetyPreset: number, tastePreset: number) => {
    if (disabled) return
    onVote(safetyPreset, tastePreset)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Vote</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Safety Presets */}
        <div>
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">
            {appConfig.dimensions.axis1.question}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {SAFETY_PRESETS.map((preset) => (
              <motion.div
                key={preset.label}
                whileHover={{ scale: disabled ? 1 : 1.05 }}
                whileTap={{ scale: disabled ? 1 : 0.95 }}
              >
                <Button
                  variant="outline"
                  className="w-full h-16 flex flex-col gap-1"
                  onClick={() => {
                    // Combine with neutral taste (50)
                    handlePresetVote(preset.safety, 50)
                  }}
                  disabled={disabled}
                >
                  <span className="text-sm font-semibold">{preset.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {preset.safety}
                  </span>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Taste Presets */}
        <div>
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">
            {appConfig.dimensions.axis2.question}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {TASTE_PRESETS.map((preset) => (
              <motion.div
                key={preset.label}
                whileHover={{ scale: disabled ? 1 : 1.05 }}
                whileTap={{ scale: disabled ? 1 : 0.95 }}
              >
                <Button
                  variant="outline"
                  className="w-full h-16 flex flex-col gap-1"
                  onClick={() => {
                    // Combine with neutral safety (50)
                    handlePresetVote(50, preset.taste)
                  }}
                  disabled={disabled}
                >
                  <span className="text-sm font-semibold">{preset.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {preset.taste}
                  </span>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Combined Quick Votes */}
        <div>
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">
            Or choose a combo:
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {/* Row 1: Top-Left (Survivor) | Top-Right (Holy Grail) */}
            <motion.div
              whileHover={{ scale: disabled ? 1 : 1.05 }}
              whileTap={{ scale: disabled ? 1 : 0.95 }}
            >
              <Button
                className="w-full h-16 text-white hover:opacity-90"
                style={{ backgroundColor: appConfig.quadrants.topLeft.color }}
                onClick={() => handlePresetVote(90, 30)}
                disabled={disabled}
              >
                <div className="text-center">
                  <div className="font-semibold">{appConfig.quadrants.topLeft.label}</div>
                  <div className="text-xs opacity-80">Safe but Meh</div>
                </div>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: disabled ? 1 : 1.05 }}
              whileTap={{ scale: disabled ? 1 : 0.95 }}
            >
              <Button
                className="w-full h-16 text-white hover:opacity-90"
                style={{ backgroundColor: appConfig.quadrants.topRight.color }}
                onClick={() => handlePresetVote(90, 90)}
                disabled={disabled}
              >
                <div className="text-center">
                  <div className="font-semibold">{appConfig.quadrants.topRight.label}</div>
                  <div className="text-xs opacity-80">Safe & Tasty</div>
                </div>
              </Button>
            </motion.div>

            {/* Row 2: Bottom-Left (The Bin) | Bottom-Right (Russian Roulette) */}
            <motion.div
              whileHover={{ scale: disabled ? 1 : 1.05 }}
              whileTap={{ scale: disabled ? 1 : 0.95 }}
            >
              <Button
                className="w-full h-16 text-white hover:opacity-90"
                style={{ backgroundColor: appConfig.quadrants.bottomLeft.color }}
                onClick={() => handlePresetVote(10, 10)}
                disabled={disabled}
              >
                <div className="text-center">
                  <div className="font-semibold">{appConfig.quadrants.bottomLeft.label}</div>
                  <div className="text-xs opacity-80">Avoid!</div>
                </div>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: disabled ? 1 : 1.05 }}
              whileTap={{ scale: disabled ? 1 : 0.95 }}
            >
              <Button
                className="w-full h-16 text-white hover:opacity-90"
                style={{ backgroundColor: appConfig.quadrants.bottomRight.color }}
                onClick={() => handlePresetVote(30, 90)}
                disabled={disabled}
              >
                <div className="text-center">
                  <div className="font-semibold">{appConfig.quadrants.bottomRight.label}</div>
                  <div className="text-xs opacity-80">Tasty but Risky</div>
                </div>
              </Button>
            </motion.div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
