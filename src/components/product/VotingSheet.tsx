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

interface VotingSheetProps {
  onVote: (safety: number, taste: number, price?: number) => void
  disabled?: boolean
  averageSafety?: number
  averageTaste?: number
}

/**
 * Mobile-optimized voting UI
 * - Full-width safety buttons (3: Clean/Sketchy/Wrecked)
 * - Full-width taste buttons (3: Yass!/Meh/Pass)
 * - 5-level price buttons ($-$$$$$)
 * - Combo preset buttons (Holy Grail/Survivor/Risky/Bin)
 * - "Agree with Community" quick vote
 */
export function VotingSheet({ 
  onVote, 
  disabled = false,
  averageSafety,
  averageTaste
}: VotingSheetProps) {
  const [selectedSafety, setSelectedSafety] = useState<number | null>(null)
  const [selectedTaste, setSelectedTaste] = useState<number | null>(null)
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null)
  
  // Fine-tune mode state
  const [fineTuneExpanded, setFineTuneExpanded] = useState(false)
  const [fineTuneSafety, setFineTuneSafety] = useState(50)
  const [fineTuneTaste, setFineTuneTaste] = useState(50)

  const safetyPresets = appConfig.dimensions.axis1.presets
  const tastePresets = appConfig.dimensions.axis2.presets
  const pricePresets = appConfig.dimensions.axis3.presets

  const handleSafetyClick = (value: number) => {
    if (disabled) return
    setSelectedSafety(value)
    // If taste is also selected, auto-submit
    if (selectedTaste !== null) {
      onVote(value, selectedTaste, selectedPrice ?? undefined)
      resetSelections()
    }
  }

  const handleTasteClick = (value: number) => {
    if (disabled) return
    setSelectedTaste(value)
    // If safety is also selected, auto-submit
    if (selectedSafety !== null) {
      onVote(selectedSafety, value, selectedPrice ?? undefined)
      resetSelections()
    }
  }

  const handlePriceClick = (value: number) => {
    if (disabled) return
    setSelectedPrice(value === selectedPrice ? null : value)
  }

  const handleComboVote = (safety: number, taste: number) => {
    if (disabled) return
    onVote(safety, taste, selectedPrice ?? undefined)
    resetSelections()
  }
  
  const handleFineTuneSubmit = () => {
    if (disabled) return
    onVote(fineTuneSafety, fineTuneTaste, selectedPrice ?? undefined)
    resetSelections()
    setFineTuneExpanded(false)
  }

  const resetSelections = () => {
    setSelectedSafety(null)
    setSelectedTaste(null)
    setSelectedPrice(null)
  }
  
  // Calculate quadrant for fine-tune preview
  const fineTuneQuadrant = getQuadrant(fineTuneSafety, fineTuneTaste)
  const fineTuneQuadrantInfo = QUADRANTS[fineTuneQuadrant]

  return (
    <div className="space-y-6">
      {/* Safety Buttons */}
      <div>
        <label className="text-sm font-semibold text-color-text mb-3 block">
          {appConfig.dimensions.axis1.question}
        </label>
        <div className="space-y-2">
          {safetyPresets.map((preset) => (
            <motion.div
              key={preset.label}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
            >
              <Button
                variant={selectedSafety === preset.value ? 'default' : 'outline'}
                className={cn(
                  'w-full h-12 justify-start text-left px-4',
                  selectedSafety === preset.value && 'bg-color-primary hover:bg-color-primary-dark'
                )}
                onClick={() => handleSafetyClick(preset.value)}
                disabled={disabled}
              >
                <span className="text-xl mr-3">{preset.emoji}</span>
                <div className="flex-1">
                  <div className="font-semibold">{preset.label}</div>
                  <div className="text-xs opacity-70">{preset.description}</div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Taste Buttons */}
      <div>
        <label className="text-sm font-semibold text-color-text mb-3 block">
          {appConfig.dimensions.axis2.question}
        </label>
        <div className="space-y-2">
          {tastePresets.map((preset) => (
            <motion.div
              key={preset.label}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
            >
              <Button
                variant={selectedTaste === preset.value ? 'default' : 'outline'}
                className={cn(
                  'w-full h-12 justify-start text-left px-4',
                  selectedTaste === preset.value && 'bg-color-primary hover:bg-color-primary-dark'
                )}
                onClick={() => handleTasteClick(preset.value)}
                disabled={disabled}
              >
                <span className="text-xl mr-3">{preset.emoji}</span>
                <div className="flex-1">
                  <div className="font-semibold">{preset.label}</div>
                  <div className="text-xs opacity-70">{preset.description}</div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Price Buttons (Optional) */}
      <div>
        <label className="text-sm font-semibold text-color-text mb-3 block">
          {appConfig.dimensions.axis3.question} <span className="text-xs font-normal text-color-text-secondary">(optional)</span>
        </label>
        <div className="flex gap-2">
          {pricePresets.map((preset, index) => (
            <motion.div
              key={preset.label}
              whileTap={{ scale: disabled ? 1 : 0.95 }}
              className="flex-1"
            >
              <Button
                variant={selectedPrice === (index + 1) * 20 ? 'default' : 'outline'}
                className={cn(
                  'w-full h-10 text-xs',
                  selectedPrice === (index + 1) * 20 && 'bg-color-primary hover:bg-color-primary-dark'
                )}
                onClick={() => handlePriceClick((index + 1) * 20)}
                disabled={disabled}
                title={preset.description}
              >
                {preset.emoji}
              </Button>
            </motion.div>
          ))}
        </div>
        <p className="text-xs text-color-text-secondary mt-2">
          Tap to select price level (tap again to deselect)
        </p>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-color-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-color-text-secondary">Or use combo</span>
        </div>
      </div>

      {/* Combo Presets */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div whileTap={{ scale: disabled ? 1 : 0.98 }}>
          <Button
            className="w-full h-16 bg-color-primary hover:bg-color-primary-dark text-white"
            onClick={() => handleComboVote(90, 90)}
            disabled={disabled}
          >
            <div className="text-center">
              <div className="text-lg mb-1">{appConfig.quadrants.topRight.emoji}</div>
              <div className="font-semibold text-sm">{appConfig.quadrants.topRight.label}</div>
            </div>
          </Button>
        </motion.div>

        <motion.div whileTap={{ scale: disabled ? 1 : 0.98 }}>
          <Button
            variant="outline"
            className="w-full h-16"
            onClick={() => handleComboVote(90, 30)}
            disabled={disabled}
          >
            <div className="text-center">
              <div className="text-lg mb-1">{appConfig.quadrants.topLeft.emoji}</div>
              <div className="font-semibold text-sm">{appConfig.quadrants.topLeft.label}</div>
            </div>
          </Button>
        </motion.div>

        <motion.div whileTap={{ scale: disabled ? 1 : 0.98 }}>
          <Button
            variant="outline"
            className="w-full h-16"
            onClick={() => handleComboVote(30, 90)}
            disabled={disabled}
          >
            <div className="text-center">
              <div className="text-lg mb-1">{appConfig.quadrants.bottomRight.emoji}</div>
              <div className="font-semibold text-sm">{appConfig.quadrants.bottomRight.label}</div>
            </div>
          </Button>
        </motion.div>

        <motion.div whileTap={{ scale: disabled ? 1 : 0.98 }}>
          <Button
            variant="destructive"
            className="w-full h-16"
            onClick={() => handleComboVote(10, 10)}
            disabled={disabled}
          >
            <div className="text-center">
              <div className="text-lg mb-1">{appConfig.quadrants.bottomLeft.emoji}</div>
              <div className="font-semibold text-sm">{appConfig.quadrants.bottomLeft.label}</div>
            </div>
          </Button>
        </motion.div>
      </div>

      {/* Fine Tune Section (Collapsible) */}
      <div className="border border-color-border rounded-xl overflow-hidden">
        <motion.button
          type="button"
          className="w-full flex items-center justify-between p-4 bg-color-bg hover:bg-gray-50 transition-colors"
          onClick={() => setFineTuneExpanded(!fineTuneExpanded)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-color-primary" />
            <span className="font-semibold text-sm text-color-text">Fine Tune (Precise Control)</span>
          </div>
          {fineTuneExpanded ? (
            <ChevronUp className="h-5 w-5 text-color-text-secondary" />
          ) : (
            <ChevronDown className="h-5 w-5 text-color-text-secondary" />
          )}
        </motion.button>

        <AnimatePresence>
          {fineTuneExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-2 space-y-5 bg-white border-t border-color-border">
                {/* Safety Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fine-safety-slider" className="text-sm font-semibold text-color-text">
                      {appConfig.dimensions.axis1.label}
                    </Label>
                    <span className="text-lg font-bold text-color-primary tabular-nums min-w-[3ch] text-right">
                      {fineTuneSafety}
                    </span>
                  </div>
                  <Slider
                    id="fine-safety-slider"
                    min={0}
                    max={100}
                    step={1}
                    value={[fineTuneSafety]}
                    onValueChange={([value]) => value !== undefined && setFineTuneSafety(value)}
                    disabled={disabled}
                    className="w-full [&_[role=slider]]:h-6 [&_[role=slider]]:w-6"
                  />
                  <div className="flex justify-between text-xs text-color-text-secondary">
                    <span>0 (Dangerous)</span>
                    <span>100 (Very Safe)</span>
                  </div>
                </div>

                {/* Taste Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fine-taste-slider" className="text-sm font-semibold text-color-text">
                      {appConfig.dimensions.axis2.label}
                    </Label>
                    <span className="text-lg font-bold text-color-primary tabular-nums min-w-[3ch] text-right">
                      {fineTuneTaste}
                    </span>
                  </div>
                  <Slider
                    id="fine-taste-slider"
                    min={0}
                    max={100}
                    step={1}
                    value={[fineTuneTaste]}
                    onValueChange={([value]) => value !== undefined && setFineTuneTaste(value)}
                    disabled={disabled}
                    className="w-full [&_[role=slider]]:h-6 [&_[role=slider]]:w-6"
                  />
                  <div className="flex justify-between text-xs text-color-text-secondary">
                    <span>0 (Terrible)</span>
                    <span>100 (Delicious)</span>
                  </div>
                </div>

                {/* Quadrant Preview */}
                <div 
                  className="p-3 rounded-lg border-2"
                  style={{ 
                    borderColor: fineTuneQuadrantInfo?.color || appConfig.colors.primary,
                    backgroundColor: `${fineTuneQuadrantInfo?.color || appConfig.colors.primary}10`
                  }}
                >
                  <div className="text-center">
                    <div className="text-xs font-medium text-color-text-secondary mb-1">
                      This will place it in:
                    </div>
                    <div className="text-base font-bold text-color-text flex items-center justify-center gap-2">
                      <span className="text-lg">{appConfig.quadrants[fineTuneQuadrant as keyof typeof appConfig.quadrants]?.emoji}</span>
                      {fineTuneQuadrantInfo?.name || 'Unknown'}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.div whileTap={{ scale: disabled ? 1 : 0.98 }}>
                  <Button
                    onClick={handleFineTuneSubmit}
                    disabled={disabled}
                    className="w-full h-12 bg-color-primary hover:bg-color-primary-dark text-white font-semibold"
                  >
                    Submit Fine-Tuned Vote
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Agree with Community Button */}
      {averageSafety !== undefined && averageTaste !== undefined && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-color-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-color-text-secondary">Quick vote</span>
            </div>
          </div>

          <motion.div whileTap={{ scale: disabled ? 1 : 0.98 }}>
            <Button
              variant="outline"
              className="w-full h-14 flex items-center justify-center gap-2 border-2 border-color-primary hover:bg-color-primary hover:text-white"
              onClick={() => onVote(averageSafety, averageTaste, selectedPrice ?? undefined)}
              disabled={disabled}
            >
              <ThumbsUp className="h-5 w-5" />
              <div className="text-center">
                <div className="font-semibold text-sm">Agree with Community</div>
                <div className="text-xs text-color-text-secondary">
                  Safety: {Math.round(averageSafety)} • Taste: {Math.round(averageTaste)}
                </div>
              </div>
            </Button>
          </motion.div>
        </>
      )}

      {/* Help Text */}
      {(selectedSafety !== null || selectedTaste !== null) && (
        <p className="text-xs text-center text-color-text-secondary">
          {selectedSafety !== null && selectedTaste === null && 'Now select taste to submit vote'}
          {selectedTaste !== null && selectedSafety === null && 'Now select safety to submit vote'}
        </p>
      )}
    </div>
  )
}
