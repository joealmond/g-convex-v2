import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, ThumbsDown, ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { appConfig } from '@/lib/app-config'
import { useTranslation } from '@/hooks/use-translation'
import type { AllergenScoresMap } from '@/lib/score-utils'
import { computeAllergenScoreFromData, computeTasteScore } from '@/lib/score-utils'
import { cn } from '@/lib/utils'

export interface ThumbsVotePayload {
  allergenVotes?: Record<string, 'up' | 'down'>
  tasteVote?: 'up' | 'down'
  price?: number
  exactPrice?: { amount: number; currency: string }
}

interface VotingSheetProps {
  onVote: (payload: ThumbsVotePayload) => void
  disabled?: boolean
  allergenScores?: AllergenScoresMap | null
  tasteUpVotes?: number
  tasteDownVotes?: number
  avoidedAllergens?: string[]
}

export function VotingSheet({
  onVote,
  disabled = false,
  allergenScores,
  tasteUpVotes = 0,
  tasteDownVotes = 0,
  avoidedAllergens = [],
}: VotingSheetProps) {
  const { t } = useTranslation()
  const [allergenVotes, setAllergenVotes] = useState<Record<string, 'up' | 'down'>>({})
  const [tasteVote, setTasteVote] = useState<'up' | 'down' | null>(null)
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null)
  const [showPriceDetails, setShowPriceDetails] = useState(false)
  const [showExactPrice, setShowExactPrice] = useState(false)
  const [exactPriceAmount, setExactPriceAmount] = useState('')
  const [exactPriceCurrency, setExactPriceCurrency] = useState('USD')
  const [showMoreAllergens, setShowMoreAllergens] = useState(false)

  const pricePresets = appConfig.dimensions.axis3.presets
  const allAllergens = appConfig.allergens
  const userAllergens = allAllergens.filter((allergen) => avoidedAllergens.includes(allergen.id))
  const otherAllergens = allAllergens.filter((allergen) => !avoidedAllergens.includes(allergen.id))
  const allergensToShow = userAllergens.length > 0 ? userAllergens : allAllergens
  const hasAnyVote = Object.keys(allergenVotes).length > 0 || tasteVote !== null
  const currentTasteScore = computeTasteScore(tasteUpVotes, tasteDownVotes)
  const tasteColorClass = currentTasteScore >= 60 ? 'bg-safety-high' : currentTasteScore >= 40 ? 'bg-safety-mid' : 'bg-safety-low'

  const handleAllergenVote = (allergenId: string, direction: 'up' | 'down') => {
    if (disabled) return

    setAllergenVotes((prev) => {
      const next = { ...prev }
      if (next[allergenId] === direction) {
        delete next[allergenId]
      } else {
        next[allergenId] = direction
      }
      return next
    })
  }

  const handleTasteVote = (direction: 'up' | 'down') => {
    if (disabled) return
    setTasteVote((prev) => (prev === direction ? null : direction))
  }

  const handlePriceClick = (value: number) => {
    if (disabled) return
    setSelectedPrice((prev) => (prev === value ? null : value))
  }

  const buildExactPrice = () => {
    if (!showExactPrice || !exactPriceAmount) return undefined
    return { amount: parseFloat(exactPriceAmount), currency: exactPriceCurrency }
  }

  const buildPriceValue = () => (selectedPrice ? Math.round(selectedPrice / 20) : undefined)

  const resetForm = () => {
    setAllergenVotes({})
    setTasteVote(null)
    setSelectedPrice(null)
    setShowPriceDetails(false)
    setShowExactPrice(false)
    setExactPriceAmount('')
    setExactPriceCurrency('USD')
  }

  const handleSubmit = () => {
    if (disabled || !hasAnyVote) return

    onVote({
      allergenVotes: Object.keys(allergenVotes).length > 0 ? allergenVotes : undefined,
      tasteVote: tasteVote ?? undefined,
      price: buildPriceValue(),
      exactPrice: buildExactPrice(),
    })

    resetForm()
  }

  const renderAllergenRow = (allergen: typeof allAllergens[number]) => {
    const scoreData = allergenScores?.[allergen.id]
    const currentScore = scoreData ? computeAllergenScoreFromData(scoreData) : null
    const myVote = allergenVotes[allergen.id]

    return (
      <div key={allergen.id} className="flex items-center gap-2 py-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{allergen.emoji}</span>
            <span className="truncate text-sm font-medium">{allergen.label}</span>
          </div>
          {currentScore !== null && (
            <div className="mt-0.5 flex items-center gap-1.5">
              <div className="h-1 max-w-16 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    currentScore >= 60 ? 'bg-safety-high' : currentScore >= 40 ? 'bg-safety-mid' : 'bg-safety-low'
                  )}
                  style={{ width: `${currentScore}%` }}
                />
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground">{currentScore}</span>
              {scoreData && (
                <span className="text-[10px] text-muted-foreground">
                  ({scoreData.upVotes}👍 {scoreData.downVotes}👎)
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-1.5">
          <motion.div whileTap={{ scale: disabled ? 1 : 0.9 }}>
            <Button
              variant={myVote === 'up' ? 'default' : 'outline'}
              size="sm"
              className={cn('h-9 w-9 p-0', myVote === 'up' && 'bg-safety-high text-white hover:bg-safety-high/90')}
              onClick={() => handleAllergenVote(allergen.id, 'up')}
              disabled={disabled}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: disabled ? 1 : 0.9 }}>
            <Button
              variant={myVote === 'down' ? 'default' : 'outline'}
              size="sm"
              className={cn('h-9 w-9 p-0', myVote === 'down' && 'bg-safety-low text-white hover:bg-safety-low/90')}
              onClick={() => handleAllergenVote(allergen.id, 'down')}
              disabled={disabled}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('voting.voteOnAllergens')}
        </label>

        <div className="divide-y divide-border">
          {allergensToShow.map(renderAllergenRow)}
        </div>

        {userAllergens.length > 0 && otherAllergens.length > 0 && (
          <div className="mt-1">
            <button
              type="button"
              className="flex items-center gap-1.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setShowMoreAllergens((prev) => !prev)}
            >
              {showMoreAllergens ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {showMoreAllergens ? t('voting.showLess') : t('voting.showMoreAllergens')}
              <span className="text-muted-foreground/60">({otherAllergens.length})</span>
            </button>

            <AnimatePresence initial={false}>
              {showMoreAllergens && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="mt-1 divide-y divide-border">
                    {otherAllergens.map(renderAllergenRow)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('voting.taste')}
        </label>
        <div className="flex items-center gap-3 rounded-2xl border border-border px-3 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium">{appConfig.dimensions.axis2.label}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <div className="h-1 max-w-24 flex-1 overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full rounded-full transition-all', tasteColorClass)} style={{ width: `${currentTasteScore}%` }} />
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground">{currentTasteScore}</span>
              <span className="text-[10px] text-muted-foreground">({tasteUpVotes}👍 {tasteDownVotes}👎)</span>
            </div>
          </div>

          <div className="flex gap-1.5">
            <motion.div whileTap={{ scale: disabled ? 1 : 0.9 }}>
              <Button
                variant={tasteVote === 'up' ? 'default' : 'outline'}
                size="sm"
                className={cn('h-9 w-9 p-0', tasteVote === 'up' && 'bg-safety-high text-white hover:bg-safety-high/90')}
                onClick={() => handleTasteVote('up')}
                disabled={disabled}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: disabled ? 1 : 0.9 }}>
              <Button
                variant={tasteVote === 'down' ? 'default' : 'outline'}
                size="sm"
                className={cn('h-9 w-9 p-0', tasteVote === 'down' && 'bg-safety-low text-white hover:bg-safety-low/90')}
                onClick={() => handleTasteVote('down')}
                disabled={disabled}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/30">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          onClick={() => setShowPriceDetails((prev) => !prev)}
        >
          <div>
            <p className="text-sm font-semibold text-foreground">{t('voting.addPriceDetails')}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedPrice
                ? `${t('voting.price')}: ${pricePresets.find((preset) => preset.value === selectedPrice)?.label ?? selectedPrice}`
                : t('voting.priceDetailsHelp')}
            </p>
          </div>
          {showPriceDetails ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {showPriceDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border px-4 py-4">
                <div className="mb-3 grid grid-cols-5 gap-2">
                  {pricePresets.map((preset) => {
                    const isSelected = selectedPrice === preset.value
                    return (
                      <motion.div key={preset.value} whileTap={{ scale: disabled ? 1 : 0.94 }}>
                        <Button
                          variant={isSelected ? 'default' : 'outline'}
                          className={cn('h-14 w-full flex-col gap-0.5 px-0 py-1', isSelected && 'bg-primary text-primary-foreground')}
                          onClick={() => handlePriceClick(preset.value)}
                          disabled={disabled}
                        >
                          <span className="text-base leading-none">{preset.emoji}</span>
                          <span className="text-[10px] leading-none">{preset.label}</span>
                        </Button>
                      </motion.div>
                    )
                  })}
                </div>

                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => setShowExactPrice((prev) => !prev)}
                >
                  {showExactPrice ? `${t('common.close')} ${t('voting.exactPrice').toLowerCase()}` : t('voting.exactPrice')}
                </button>

                <AnimatePresence initial={false}>
                  {showExactPrice && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          placeholder={t('voting.enterPrice')}
                          value={exactPriceAmount}
                          onChange={(event) => setExactPriceAmount(event.target.value)}
                          disabled={disabled}
                        />
                        <Input
                          placeholder={t('voting.currency')}
                          value={exactPriceCurrency}
                          onChange={(event) => setExactPriceCurrency(event.target.value.toUpperCase())}
                          disabled={disabled}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {hasAnyVote && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            onClick={handleSubmit}
            disabled={disabled}
            className="h-11 w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {t('voting.submitVote')}
          </Button>
        </motion.div>
      )}
    </div>
  )
}
