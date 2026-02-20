import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { SAFETY_PRESETS, TASTE_PRESETS } from '@/lib/types'
import { appConfig } from '@/lib/app-config'
import { useTranslation } from '@/hooks/use-translation'
import { QuadrantPicker } from '@/components/QuadrantPicker'

interface VotingPanelProps {
  onVote: (safety: number, taste: number) => void
  disabled?: boolean
}

/**
 * Quick vote panel with preset buttons for safety and taste
 * Allows users to quickly vote without precise input
 */
export function VotingPanel({ onVote, disabled = false }: VotingPanelProps) {
  const { t } = useTranslation()
  const handlePresetVote = (safetyPreset: number, tastePreset: number) => {
    if (disabled) return
    onVote(safetyPreset, tastePreset)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('voting.quickVote')}</CardTitle>
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
            {t('voting.orChooseCombo')}
          </h3>
          <QuadrantPicker
              onSelect={handlePresetVote}
              disabled={disabled}
              height="h-16"
              gap="gap-2"
              subLabels={{
                topLeft: t('voting.safeMeh'),
                topRight: t('voting.safeTasty'),
                bottomLeft: t('voting.avoid'),
                bottomRight: t('voting.tastyRisky'),
              }}
            />
        </div>
      </CardContent>
    </Card>
  )
}
