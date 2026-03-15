/**
 * Score Computation Utilities
 *
 * Core math for the per-allergen safety scoring system.
 * Used by both the backend (recalculate) and the frontend (personalized display).
 *
 * Architecture:
 *  1. AI analysis sets an initial per-allergen classification (contains / free-from / unknown).
 *  2. Community votes (thumbs up/down per allergen) shift the score via Bayesian updating.
 *  3. Each user sees a personalized safety = the LOWEST score among their avoided allergens.
 *  4. Taste uses the same thumbs model with a neutral starting point.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type AiBase = 'contains' | 'free-from' | 'unknown'
export type ThumbVote = 'up' | 'down'

export interface AllergenScoreData {
  aiBase: AiBase
  upVotes: number
  downVotes: number
}

/** Per-allergen scores stored on a product document */
export type AllergenScoresMap = Record<string, AllergenScoreData>
export type AllergenState = 'likely-unsafe' | 'uncertain' | 'likely-safe'
export type AllergenConfidence = 'low' | 'medium' | 'high'
export type SafetyDisplayState = 'likely-unsafe' | 'needs-review' | 'likely-safe'

export interface SafetyDisplayMeta {
  score: number
  voteCount: number
  allergenId: string | null
  aiBase: AiBase | null
}

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Virtual votes injected by AI classification.
 * These act as a Bayesian prior — with zero community votes the score
 * reflects the AI assessment; as community votes accumulate they dominate.
 *
 * contains  → 2 virtual 👎 → initial score ≈ 0
 * free-from → 2 virtual 👍 + 1 virtual 👎 → initial score ≈ 67
 * unknown   → 1 virtual 👍 + 1 virtual 👎 → initial score = 50
 */
const AI_VIRTUAL_VOTES: Record<AiBase, { up: number; down: number }> = {
  'contains':  { up: 0, down: 2 },
  'free-from': { up: 2, down: 1 },
  'unknown':   { up: 1, down: 1 },
}

// ─── Per-Allergen Score ──────────────────────────────────────────────────────

/**
 * Compute safety score for a single allergen on a product.
 *
 * Formula (Bayesian with virtual votes):
 *   score = (virtualUp + communityUp) / (virtualUp + virtualDown + communityUp + communityDown) × 100
 *
 * Examples:
 *   free-from, 0 community votes → (2+0)/(2+1+0+0) ≈ 67
 *   contains,  0 community votes → (0+0)/(0+2+0+0) = 0
 *   unknown,   0 community votes → (1+0)/(1+1+0+0) = 50
 *   contains, 15👍 2👎           → (0+15)/(0+2+15+2) ≈ 79  (community overrides AI)
 *   free-from, 0👍 5👎           → (2+0)/(2+1+0+5) = 25   (community flags issue)
 */
export function computeAllergenScore(
  aiBase: AiBase,
  upVotes: number,
  downVotes: number,
): number {
  const virtual = AI_VIRTUAL_VOTES[aiBase]
  const totalUp = virtual.up + upVotes
  const totalDown = virtual.down + downVotes
  const total = totalUp + totalDown
  if (total === 0) return 50 // Should never happen with virtual votes, but guard
  return Math.round((totalUp / total) * 100)
}

/**
 * Compute score from an AllergenScoreData object (convenience wrapper).
 */
export function computeAllergenScoreFromData(data: AllergenScoreData): number {
  return computeAllergenScore(data.aiBase, data.upVotes, data.downVotes)
}

/**
 * Derive the conservative user-facing state for an allergen score.
 */
export function deriveAllergenState(
  score: number,
  independentVoteCount: number,
): AllergenState {
  if (score <= 25) return 'likely-unsafe'
  if (score >= 80 && independentVoteCount >= 5) return 'likely-safe'
  return 'uncertain'
}

/**
 * Derive a simple confidence label from the independent vote count.
 */
export function deriveAllergenConfidence(
  independentVoteCount: number,
): AllergenConfidence {
  if (independentVoteCount <= 2) return 'low'
  if (independentVoteCount <= 9) return 'medium'
  return 'high'
}

/**
 * Derive the browse-facing safety status.
 * Uncertain items are presented as needing review rather than implying balance.
 */
export function deriveSafetyDisplayState(
  score: number,
  independentVoteCount: number,
): SafetyDisplayState {
  const state = deriveAllergenState(score, independentVoteCount)
  if (state === 'uncertain') return 'needs-review'
  return state
}

/**
 * Find the limiting allergen score for a given set of relevant allergens.
 * Falls back to worst-case across all allergens, then to unknown.
 */
export function computeSafetyDisplayMeta(
  allergenScores: AllergenScoresMap | undefined | null,
  relevantAllergens: string[],
): SafetyDisplayMeta {
  if (!allergenScores || Object.keys(allergenScores).length === 0) {
    return { score: 50, voteCount: 0, allergenId: null, aiBase: null }
  }

  const relevantAllergenIds = relevantAllergens.length > 0
    ? relevantAllergens
    : Object.keys(allergenScores)

  let limitingScore = Number.POSITIVE_INFINITY
  let limitingVoteCount = 0
  let limitingAllergenId: string | null = null
  let limitingAiBase: AiBase | null = null

  for (const allergenId of relevantAllergenIds) {
    const data = allergenScores[allergenId]
    if (!data) continue

    const score = computeAllergenScoreFromData(data)
    if (score < limitingScore) {
      limitingScore = score
      limitingVoteCount = data.upVotes + data.downVotes
      limitingAllergenId = allergenId
      limitingAiBase = data.aiBase
    }
  }

  if (!Number.isFinite(limitingScore)) {
    return { score: 50, voteCount: 0, allergenId: null, aiBase: null }
  }

  return {
    score: limitingScore,
    voteCount: limitingVoteCount,
    allergenId: limitingAllergenId,
    aiBase: limitingAiBase,
  }
}

// ─── Personalized Safety ─────────────────────────────────────────────────────

/**
 * Compute the personalized safety score a user sees for a product.
 *
 * Logic:
 *   1. For each allergen in user's avoidedAllergens → compute per-allergen score.
 *   2. Return the MINIMUM (worst-case = your limiting allergen).
 *   3. If no dietary profile (empty array) → return min of ALL allergen scores (worst-case for anyone).
 *   4. If product has no allergenScores → return 50 (unknown).
 */
export function computePersonalizedSafety(
  allergenScores: AllergenScoresMap | undefined | null,
  avoidedAllergens: string[],
): number {
  if (!allergenScores || Object.keys(allergenScores).length === 0) {
    return 50 // No data = unknown
  }

  // If user has avoided allergens, filter to only those
  const relevantAllergens = avoidedAllergens.length > 0
    ? avoidedAllergens
    : Object.keys(allergenScores) // No profile = show worst of all

  const scores: number[] = []
  for (const allergenId of relevantAllergens) {
    const data = allergenScores[allergenId]
    if (data) {
      scores.push(computeAllergenScoreFromData(data))
    }
    // If allergen not in product's scores, skip it (product has no data for it)
  }

  if (scores.length === 0) {
    return 50 // Product has no data for any of user's allergens
  }

  return Math.min(...scores)
}

// ─── Taste Score ─────────────────────────────────────────────────────────────

/**
 * Compute taste score from thumbs up/down community votes.
 *
 * Uses 1 virtual 👍 + 1 virtual 👎 as prior → starts at 50 with 0 votes.
 * Formula: score = (1 + upVotes) / (2 + upVotes + downVotes) × 100
 */
export function computeTasteScore(upVotes: number, downVotes: number): number {
  const totalUp = 1 + upVotes
  const totalDown = 1 + downVotes
  const total = totalUp + totalDown
  return Math.round((totalUp / total) * 100)
}

// ─── AI Base Classification ──────────────────────────────────────────────────

/**
 * Derive per-allergen AI base classification from product allergen/freeFrom data.
 *
 * Logic for each known allergen:
 *   - In product.allergens → 'contains'
 *   - In product.freeFrom  → 'free-from'
 *   - Neither              → 'unknown'
 *
 * @param allergens - Allergens the product CONTAINS (from AI analysis / barcode)
 * @param freeFrom  - Allergens the product is FREE FROM
 * @param knownAllergenIds - All allergen IDs from app config
 * @returns Map of allergenId → AllergenScoreData with zero community votes
 */
export function buildInitialAllergenScores(
  allergens: string[] | undefined,
  freeFrom: string[] | undefined,
  knownAllergenIds: string[],
): AllergenScoresMap {
  const allergensSet = new Set((allergens ?? []).map(a => a.toLowerCase()))
  const freeFromSet = new Set((freeFrom ?? []).map(a => a.toLowerCase()))

  const scores: AllergenScoresMap = {}

  for (const id of knownAllergenIds) {
    let aiBase: AiBase
    if (allergensSet.has(id)) {
      aiBase = 'contains'
    } else if (freeFromSet.has(id)) {
      aiBase = 'free-from'
    } else {
      aiBase = 'unknown'
    }
    scores[id] = { aiBase, upVotes: 0, downVotes: 0 }
  }

  return scores
}

// ─── Universal Safety (for backward-compatible sorting) ──────────────────────

/**
 * Compute universal safety = lowest of ALL allergen scores.
 * Used as `averageSafety` on the product for feed sorting, chart default, etc.
 */
export function computeUniversalSafety(
  allergenScores: AllergenScoresMap | undefined | null,
): number {
  if (!allergenScores || Object.keys(allergenScores).length === 0) {
    return 50
  }
  const scores = Object.values(allergenScores).map(computeAllergenScoreFromData)
  return Math.min(...scores)
}
