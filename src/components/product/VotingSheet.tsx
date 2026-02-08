'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { appConfig } from '@/lib/app-config'
import { cn } from '@/lib/utils'

interface VotingSheetProps {
  onVote: (safety: number, taste: number, price?: number) => void
  disabled?: boolean
}

/**
 * Mobile-optimized voting UI
 * - Full-width safety buttons (3: Clean/Sketchy/Wrecked)
 * - Full-width taste buttons (3: Yass!/Meh/Pass)
 * - 5-level price buttons ($-$$$$$)
 * - Combo preset buttons (Holy Grail/Survivor/Risky/Bin)
 */
export function VotingSheet({ onVote, disabled = false }: VotingSheetProps) {
  const [selectedSafety, setSelectedSafety] = useState<number | null>(null)
  const [selectedTaste, setSelectedTaste] = useState<number | null>(null)
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null)

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

  const resetSelections = () => {
    setSelectedSafety(null)
    setSelectedTaste(null)
    setSelectedPrice(null)
  }

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
