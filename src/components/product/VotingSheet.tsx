'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { motion, AnimatePresence } from 'framer-motion'
import { appConfig } from '@/lib/app-config'
import { cn } from '@/lib/utils'
import { ThumbsUp, ChevronDown, ChevronUp, Sliders } from 'lucide-react'
import { getQuadrant, QUADRANTS } from '@/lib/types'
import { useTranslation } from '@/hooks/use-translation'

interface VotingSheetProps {
  onVote: (safety: number, taste: number, price?: number) => void
  disabled?: boolean
  averageSafety?: number
  averageTaste?: number
}

/**
 * Compact mobile-optimized voting UI
 * - "Agree with Community" quick vote at the top
 * - 4 quadrant combo buttons as the primary input
 * - Optional price row
 * - Collapsible Fine Tune for precise slider control
 */
export function VotingSheet({ 
  onVote, 
  disabled = false,
  averageSafety,
  averageTaste
}: VotingSheetProps) {
  const { t } = useTranslation()
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null)
  
  // Fine-tune mode state
  const [fineTuneExpanded, setFineTuneExpanded] = useState(false)
  const [fineTuneSafety, setFineTuneSafety] = useState(50)
  const [fineTuneTaste, setFineTuneTaste] = useState(50)

  const pricePresets = appConfig.dimensions.axis3.presets

  const handlePriceClick = (value: number) => {
    if (disabled) return
    setSelectedPrice(value === selectedPrice ? null : value)
  }

  const handleComboVote = (safety: number, taste: number) => {
    if (disabled) return
    onVote(safety, taste, selectedPrice ?? undefined)
    setSelectedPrice(null)
  }
  
  const handleFineTuneSubmit = () => {
    if (disabled) return
    onVote(fineTuneSafety, fineTuneTaste, selectedPrice ?? undefined)
    setSelectedPrice(null)
    setFineTuneExpanded(false)
  }
  
  // Calculate quadrant for fine-tune preview
  const fineTuneQuadrant = getQuadrant(fineTuneSafety, fineTuneTaste)
  const fineTuneQuadrantInfo = QUADRANTS[fineTuneQuadrant]

  return (
    <div className="space-y-4">
      {/* Agree with Community — quickest path */}
      {averageSafety !== undefined && averageTaste !== undefined && (
        <motion.div whileTap={{ scale: disabled ? 1 : 0.98 }}>
          <Button
            variant="outline"
            className="w-full h-12 flex items-center justify-center gap-2 border-2 border-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => onVote(averageSafety, averageTaste, selectedPrice ?? undefined)}
            disabled={disabled}
          >
            <ThumbsUp className="h-4 w-4" />
            <div className="text-center">
              <span className="font-semibold text-sm">{t('voting.agreeWithCommunity')}</span>
              <span className="text-xs text-muted-foreground ml-2">
                {Math.round(averageSafety)} · {Math.round(averageTaste)}
              </span>
            </div>
          </Button>
        </motion.div>
      )}

      {/* Quick Rate — 4 quadrant combo buttons */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
          {t('voting.quickRate')}
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { q: appConfig.quadrants.topLeft, s: 90, t: 30 },
            { q: appConfig.quadrants.topRight, s: 90, t: 90 },
            { q: appConfig.quadrants.bottomLeft, s: 10, t: 10 },
            { q: appConfig.quadrants.bottomRight, s: 30, t: 90 },
          ].map(({ q, s, t }) => (
            <motion.div key={q.label} whileTap={{ scale: disabled ? 1 : 0.97 }}>
              <Button
                className="w-full h-12 text-white hover:opacity-90 text-xs font-semibold"
                style={{ backgroundColor: q.color }}
                onClick={() => handleComboVote(s, t)}
                disabled={disabled}
              >
                {q.emoji} {q.label}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Price (Optional) */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
          {appConfig.dimensions.axis3.question} <span className="font-normal normal-case">(optional)</span>
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {pricePresets.map((preset, index) => {
            const val = (index + 1) * 20
            return (
              <motion.div key={preset.label} whileTap={{ scale: disabled ? 1 : 0.95 }}>
                <Button
                  variant={selectedPrice === val ? 'default' : 'outline'}
                  className={cn(
                    'w-full h-10 text-xs px-1',
                    selectedPrice === val && 'bg-primary hover:bg-primary/90'
                  )}
                  onClick={() => handlePriceClick(val)}
                  disabled={disabled}
                  title={preset.description}
                >
                  {preset.emoji}
                </Button>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Fine Tune — collapsible */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between p-3 bg-muted hover:bg-muted/80 transition-colors"
          onClick={() => setFineTuneExpanded(!fineTuneExpanded)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{t('voting.fineTune')}</span>
          </div>
          {fineTuneExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <AnimatePresence>
          {fineTuneExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 space-y-4 border-t border-border">
                {/* Safety Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      {appConfig.dimensions.axis1.label}
                    </Label>
                    <span className="text-sm font-bold text-primary tabular-nums">
                      {fineTuneSafety}
                    </span>
                  </div>
                  <Slider
                    min={0} max={100} step={1}
                    value={[fineTuneSafety]}
                    onValueChange={([v]) => v !== undefined && setFineTuneSafety(v)}
                    disabled={disabled}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{t('voting.dangerousLabel')}</span>
                    <span>{t('voting.verySafeLabel')}</span>
                  </div>
                </div>

                {/* Taste Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      {appConfig.dimensions.axis2.label}
                    </Label>
                    <span className="text-sm font-bold text-primary tabular-nums">
                      {fineTuneTaste}
                    </span>
                  </div>
                  <Slider
                    min={0} max={100} step={1}
                    value={[fineTuneTaste]}
                    onValueChange={([v]) => v !== undefined && setFineTuneTaste(v)}
                    disabled={disabled}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{t('voting.terribleLabel')}</span>
                    <span>{t('voting.deliciousLabel')}</span>
                  </div>
                </div>

                {/* Quadrant Preview */}
                <div 
                  className="p-2 rounded-lg border text-center text-sm"
                  style={{ 
                    borderColor: fineTuneQuadrantInfo?.color || appConfig.colors.primary,
                    backgroundColor: `${fineTuneQuadrantInfo?.color || appConfig.colors.primary}10`
                  }}
                >
                  <span className="text-muted-foreground text-xs">{t('voting.placesIn')} </span>
                  <span className="font-bold">
                    {appConfig.quadrants[fineTuneQuadrant as keyof typeof appConfig.quadrants]?.emoji}{' '}
                    {fineTuneQuadrantInfo?.name || 'Unknown'}
                  </span>
                </div>

                {/* Submit */}
                <Button
                  onClick={handleFineTuneSubmit}
                  disabled={disabled}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  {t('voting.submitVote')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
