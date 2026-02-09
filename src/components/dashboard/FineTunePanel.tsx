import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { getQuadrant, QUADRANTS } from '@/lib/types'
import { appConfig } from '@/lib/app-config'
import { useState } from 'react'
import { useTranslation } from '@/hooks/use-translation'

interface FineTunePanelProps {
  onVote: (safety: number, taste: number) => void
  disabled?: boolean
  initialSafety?: number
  initialTaste?: number
}

/**
 * Fine-tune voting panel with sliders for precise control
 * Allows users to vote with exact safety and taste values
 */
export function FineTunePanel({
  onVote,
  disabled = false,
  initialSafety = 50,
  initialTaste = 50,
}: FineTunePanelProps) {
  const [safety, setSafety] = useState(initialSafety)
  const [taste, setTaste] = useState(initialTaste)
  const { t } = useTranslation()

  const currentQuadrant = getQuadrant(safety, taste)
  const quadrantInfo = QUADRANTS[currentQuadrant]

  const handleSubmit = () => {
    if (disabled) return
    onVote(safety, taste)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('voting.fineTuneVote')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('voting.fineTuneDesc')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Safety Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="safety-slider" className="text-sm font-medium">
              {appConfig.dimensions.axis1.label}
            </Label>
            <span className="text-sm font-semibold tabular-nums">{safety}</span>
          </div>
          <Slider
            id="safety-slider"
            min={0}
            max={100}
            step={1}
            value={[safety]}
            onValueChange={([value]) => value !== undefined && setSafety(value)}
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('voting.dangerous')}</span>
            <span>{t('voting.verySafe')}</span>
          </div>
        </div>

        {/* Taste Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="taste-slider" className="text-sm font-medium">
              {appConfig.dimensions.axis2.label}
            </Label>
            <span className="text-sm font-semibold tabular-nums">{taste}</span>
          </div>
          <Slider
            id="taste-slider"
            min={0}
            max={100}
            step={1}
            value={[taste]}
            onValueChange={([value]) => value !== undefined && setTaste(value)}
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('voting.terrible')}</span>
            <span>{t('voting.delicious')}</span>
          </div>
        </div>

        {/* Current Quadrant Preview */}
        <div className="p-4 rounded-lg border" style={{ backgroundColor: quadrantInfo?.color || appConfig.colors.primary, opacity: 0.2 }}>
          <div className="text-center">
            <div className="text-sm font-medium mb-1">
              {t('voting.placeInQuadrant')}
            </div>
            <div className="text-lg font-bold">{quadrantInfo?.name || 'Unknown'}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {quadrantInfo?.description || ''}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={disabled}
          className="w-full"
          size="lg"
        >
          {t('voting.submitVote')}
        </Button>
      </CardContent>
    </Card>
  )
}
