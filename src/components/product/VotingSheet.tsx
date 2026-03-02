import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { appConfig } from '@/lib/app-config'
import { cn } from '@/lib/utils'
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'
import type { AllergenScoresMap } from '@/lib/score-utils'
import { computeAllergenScoreFromData, computeTasteScore } from '@/lib/score-utils'

/** New vote shape emitted by VotingSheet */
export interface ThumbsVotePayload {
  allergenVotes?: Record<string, 'up' | 'down'>
  tasteVote?: 'up' | 'down'
  price?: number
  exactPrice?: { amount: number; currency: string }
}

interface VotingSheetProps {
  onVote: (payload: ThumbsVotePayload) => void
  disabled?: boolean
  /** Per-allergen scores from the product (for showing current state) */
  allergenScores?: AllergenScoresMap | null
  /** Product-level taste aggregates */
  tasteUpVotes?: number
  tasteDownVotes?: number
  /** User's avoided allergens from dietary profile */
  avoidedAllergens?: string[]
}

/**
 * Thumbs-based voting UI.
 *
 * Layout:
 *  1. "I Agree" quick endorsement button
 *  2. Per-allergen 👍/👎 rows (user's allergens expanded, rest in accordion)
 *  3. Taste 👍/👎 row
 *  4. Price section ($ to $$$$$ + optional exact price)
 *  5. Submit button
 */
export function VotingSheet({
  onVote,
  disabled = false,
  allergenScores,
  tasteUpVotes = 0,
  tasteDownVotes = 0,
  avoidedAllergens = [],
}: VotingSheetProps) {
  const { t } = useTranslation()

  // ─── State ────────────────────────────────────────────────────
  const [allergenVotes, setAllergenVotes] = useState<Record<string, 'up' | 'down'>>({})
  const [tasteVote, setTasteVote] = useState<'up' | 'down' | null>(null)
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null)
  const [showExactPrice, setShowExactPrice] = useState(false)
  const [exactPriceAmount, setExactPriceAmount] = useState('')
  const [exactPriceCurrency, setExactPriceCurrency] = useState('USD')
  const [showMoreAllergens, setShowMoreAllergens] = useState(false)

  const pricePresets = appConfig.dimensions.axis3.presets
  const allAllergens = appConfig.allergens

  // Split allergens: user's avoided first, then the rest
  const userAllergens = allAllergens.filter(a => avoidedAllergens.includes(a.id))
  const otherAllergens = allAllergens.filter(a => !avoidedAllergens.includes(a.id))
  const hasOtherAllergens = otherAllergens.length > 0

  // ─── Handlers ─────────────────────────────────────────────────
  const handleAllergenVote = (allergenId: string, direction: 'up' | 'down') => {
    if (disabled) return
    setAllergenVotes(prev => {
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
    setTasteVote(prev => prev === direction ? null : direction)
  }

  const handlePriceClick = (value: number) => {
    if (disabled) return
    setSelectedPrice(value === selectedPrice ? null : value)
  }

  const buildExactPrice = () =>
    showExactPrice && exactPriceAmount
      ? { amount: parseFloat(exactPriceAmount), currency: exactPriceCurrency }
      : undefined

  const buildPriceValue = () =>
    selectedPrice ? Math.round(selectedPrice / 20) : undefined

  const handleIAgree = () => {
    if (disabled) return
    const quickAllergenVotes: Record<string, 'up' | 'down'> = {}
    const allergensToVote = userAllergens.length > 0 ? userAllergens : allAllergens
    for (const a of allergensToVote) {
      quickAllergenVotes[a.id] = 'up'
    }
    onVote({
      allergenVotes: quickAllergenVotes,
      tasteVote: 'up',
      price: buildPriceValue(),
      exactPrice: buildExactPrice(),
    })
    resetForm()
  }

  const handleSubmit = () => {
    if (disabled) return
    const hasVotes = Object.keys(allergenVotes).length > 0 || tasteVote !== null
    if (!hasVotes) return
    onVote({
      allergenVotes: Object.keys(allergenVotes).length > 0 ? allergenVotes : undefined,
      tasteVote: tasteVote ?? undefined,
      price: buildPriceValue(),
      exactPrice: buildExactPrice(),
    })
    resetForm()
  }

  const resetForm = () => {
    setAllergenVotes({})
    setTasteVote(null)
    setSelectedPrice(null)
    setShowExactPrice(false)
    setExactPriceAmount('')
  }

  const hasAnyVote = Object.keys(allergenVotes).length > 0 || tasteVote !== null

  // ─── Render helpers ───────────────────────────────────────────
  const renderAllergenRow = (allergen: typeof allAllergens[number]) => {
    const scoreData = allergenScores?.[allergen.id]
    const currentScore = scoreData ? computeAllergenScoreFromData(scoreData) : null
    const myVote = allergenVotes[allergen.id]

    return (
      <div key={allergen.id} className="flex items-center gap-2 py-2">
        {/* Allergen label + current score bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{allergen.emoji}</span>
            <span className="text-sm font-medium truncate">{allergen.label}</span>
          </div>
          {currentScore !== null && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="h-1 flex-1 max-w-16 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    currentScore >= 60 ? 'bg-safety-high' : currentScore >= 40 ? 'bg-safety-mid' : 'bg-safety-low'
                  )}
                  style={{ width: `${currentScore}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums">{currentScore}</span>
              {scoreData && (
                <span className="text-[10px] text-muted-foreground">
                  ({scoreData.upVotes}👍 {scoreData.downVotes}👎)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Thumbs buttons */}
        <div className="flex gap-1.5">
          <motion.div whileTap={{ scale: disabled ? 1 : 0.9 }}>
            <Button
              variant={myVote === 'up' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-9 w-9 p-0',
                myVote === 'up' && 'bg-safety-high hover:bg-safety-high/90 text-white'
              )}
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
              className={cn(
                'h-9 w-9 p-0',
                myVote === 'down' && 'bg-safety-low hover:bg-safety-low/90 text-white'
              )}
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

  // ─── Taste score ──────────────────────────────────────────────
  const currentTasteScore = computeTasteScore(tasteUpVotes, tasteDownVotes)
  const tasteColorClass = currentTasteScore >= 60 ? 'bg-safety-high' : currentTasteScore >= 40 ? 'bg-safety-mid' : 'bg-safety-low'

  return (
    <div className="space-y-4">
      {/* "I Agree" quick endorsement */}
      <motion.div whileTap={{ scale: disabled ? 1 : 0.98 }}>
        <Button
          variant="outline"
          className="w-full h-12 flex items-center justify-center gap-2 border-2 border-primary hover:bg-primary hover:text-primary-foreground"
          onClick={handleIAgree}
          disabled={disabled}
        >
          <Check className="h-4 w-4" />
          <div className="text-center">
            <span className="font-semibold text-sm">{t('voting.iAgree')}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {t('voting.iAgreeDesc')}
            </span>
          </div>
        </Button>
      </motion.div>

      {/* Per-allergen voting rows */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block uppercase tracking-wide">
          {t('voting.voteOnAllergens')}
        </label>

        {/* User's avoided allergens (always expanded) */}
        {userAllergens.length > 0 && (
          <div className="divide-y divide-border">
            {userAllergens.map(renderAllergenRow)}
          </div>
        )}

        {/* If user has no allergen profile, show all allergens */}
        {userAllergens.length === 0 && (
          <div className="divide-y divide-border">
            {allAllergens.map(renderAllergenRow)}
          </div>
        )}

        {/* "Show more" accordion for other allergens */}
        {userAllergens.length > 0 && hasOtherAllergens && (
          <div className="mt-1">
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              onClick={() => setShowMoreAllergens(!showMoreAllergens)}
            >
              {showMoreAllergens ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              {showMoreAllergens ? t('voting.showLess') : t('voting.showMoreAllergens')}
              <span className="text-muted-foreground/60">({otherAllergens.length})</span>
            </button>
            <AnimatePresence>
              {showMoreAllergens && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="divide-y divide-border">
                    {otherAllergens.map(renderAllergenRow)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Taste voting row */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block uppercase tracking-wide">
          {appConfig.dimensions.axis2.label}
        </label>
        <div className="flex items-center gap-2 py-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">😋</span>
              <span className="text-sm font-medium">{appConfig.dimensions.axis2.label}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="h-1 flex-1 max-w-16 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', tasteColorClass)}
                  style={{ width: `${currentTasteScore}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {currentTasteScore}
              </span>
              <span className="text-[10px] text-muted-foreground">
                ({tasteUpVotes}👍 {tasteDownVotes}👎)
              </span>
            </div>
          </div>

          <div className="flex gap-1.5">
            <motion.div whileTap={{ scale: disabled ? 1 : 0.9 }}>
              <Button
                variant={tasteVote === 'up' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-9 w-9 p-0',
                  tasteVote === 'up' && 'bg-safety-high hover:bg-safety-high/90 text-white'
                )}
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
                className={cn(
                  'h-9 w-9 p-0',
                  tasteVote === 'down' && 'bg-safety-low hover:bg-safety-low/90 text-white'
                )}
                onClick={() => handleTasteVote('down')}
                disabled={disabled}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          </div>
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

        {/* Exact price toggle */}
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-2 flex items-center gap-1"
          onClick={() => setShowExactPrice(!showExactPrice)}
        >
          {showExactPrice ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {t('voting.exactPrice')}
        </button>
        <AnimatePresence>
          {showExactPrice && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 mt-2">
                <Input
                  type="number"
                  placeholder={t('voting.enterPrice')}
                  value={exactPriceAmount}
                  onChange={(e) => setExactPriceAmount(e.target.value)}
                  className="flex-1 h-9 text-sm"
                  min={0}
                  step="0.01"
                  disabled={disabled}
                />
                <Input
                  type="text"
                  placeholder={t('voting.currency')}
                  value={exactPriceCurrency}
                  onChange={(e) => setExactPriceCurrency(e.target.value.toUpperCase())}
                  className="w-16 h-9 text-sm text-center"
                  maxLength={3}
                  disabled={disabled}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Submit button */}
      {hasAnyVote && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            onClick={handleSubmit}
            disabled={disabled}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {t('voting.submitVote')}
          </Button>
        </motion.div>
      )}
    </div>
  )
}
