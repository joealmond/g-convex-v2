/**
 * Score Computation Utilities (Backend)
 *
 * Duplicated from src/lib/score-utils.ts for use in Convex functions.
 * Convex functions cannot import from src/ — keep these in sync.
 *
 * @see src/lib/score-utils.ts for detailed documentation.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type AiBase = 'contains' | 'free-from' | 'unknown'
export type ThumbVote = 'up' | 'down'

export interface AllergenScoreData {
  aiBase: AiBase
  upVotes: number
  downVotes: number
}

export type AllergenScoresMap = Record<string, AllergenScoreData>

// ─── Valid Allergen IDs (must match appConfig.allergens) ─────────────────────

export const VALID_ALLERGEN_IDS = ['gluten', 'milk', 'soy', 'nuts', 'eggs'] as const

// ─── Constants ───────────────────────────────────────────────────────────────

const AI_VIRTUAL_VOTES: Record<AiBase, { up: number; down: number }> = {
  'contains':  { up: 0, down: 2 },
  'free-from': { up: 2, down: 0 },
  'unknown':   { up: 1, down: 1 },
}

// ─── Per-Allergen Score ──────────────────────────────────────────────────────

export function computeAllergenScore(
  aiBase: AiBase,
  upVotes: number,
  downVotes: number,
): number {
  const virtual = AI_VIRTUAL_VOTES[aiBase]
  const totalUp = virtual.up + upVotes
  const totalDown = virtual.down + downVotes
  const total = totalUp + totalDown
  if (total === 0) return 50
  return Math.round((totalUp / total) * 100)
}

export function computeAllergenScoreFromData(data: AllergenScoreData): number {
  return computeAllergenScore(data.aiBase, data.upVotes, data.downVotes)
}

// ─── Taste Score ─────────────────────────────────────────────────────────────

export function computeTasteScore(upVotes: number, downVotes: number): number {
  const totalUp = 1 + upVotes
  const totalDown = 1 + downVotes
  const total = totalUp + totalDown
  return Math.round((totalUp / total) * 100)
}

// ─── AI Base Classification ──────────────────────────────────────────────────

export function buildInitialAllergenScores(
  allergens: string[] | undefined,
  freeFrom: string[] | undefined,
  knownAllergenIds: readonly string[] = VALID_ALLERGEN_IDS,
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

// ─── Universal Safety ────────────────────────────────────────────────────────

export function computeUniversalSafety(
  allergenScores: AllergenScoresMap | undefined | null,
): number {
  if (!allergenScores || Object.keys(allergenScores).length === 0) {
    return 50
  }
  const scores = Object.values(allergenScores).map(computeAllergenScoreFromData)
  return Math.min(...scores)
}

// ─── Aggregate Helpers ───────────────────────────────────────────────────────

/**
 * Given all votes for a product, aggregate per-allergen up/down counts.
 * Returns a new AllergenScoresMap with updated vote counts (preserving aiBase from product).
 */
export function aggregateAllergenVotes(
  existingScores: AllergenScoresMap | undefined,
  votes: Array<{
    allergenVotes?: Record<string, 'up' | 'down'> | null
  }>,
): AllergenScoresMap {
  // Start with existing aiBase values, zeroed vote counts
  const result: AllergenScoresMap = {}
  
  if (existingScores) {
    for (const [id, data] of Object.entries(existingScores)) {
      result[id] = { aiBase: data.aiBase, upVotes: 0, downVotes: 0 }
    }
  }

  // Count community votes
  for (const vote of votes) {
    if (vote.allergenVotes) {
      for (const [allergenId, direction] of Object.entries(vote.allergenVotes)) {
        if (!result[allergenId]) {
          // Allergen voted on but not in product's scores — treat as unknown
          result[allergenId] = { aiBase: 'unknown', upVotes: 0, downVotes: 0 }
        }
        if (direction === 'up') {
          result[allergenId]!.upVotes += 1
        } else {
          result[allergenId]!.downVotes += 1
        }
      }
    }
  }

  return result
}

/**
 * Aggregate taste votes from all votes for a product.
 * Returns { upVotes, downVotes }.
 */
export function aggregateTasteVotes(
  votes: Array<{
    tasteVote?: 'up' | 'down' | null
  }>,
): { upVotes: number; downVotes: number } {
  let upVotes = 0
  let downVotes = 0

  for (const vote of votes) {
    if (vote.tasteVote === 'up') {
      upVotes += 1
    } else if (vote.tasteVote === 'down') {
      downVotes += 1
    }
  }

  return { upVotes, downVotes }
}

// ─── Vote-Level Convenience Score Helpers ────────────────────────────────────

/**
 * Compute a single safety number for one vote (for chart display).
 * Uses the product's AI base + just this vote's allergen thumbs.
 */
export function computeVoteSafety(
  allergenVotes: Record<string, 'up' | 'down'> | undefined | null,
  productAllergenScores: AllergenScoresMap | undefined | null,
): number {
  if (!allergenVotes || !productAllergenScores) return 50
  const scores = Object.entries(allergenVotes).map(([id, dir]) => {
    const aiBase = productAllergenScores[id]?.aiBase ?? 'unknown'
    return computeAllergenScore(aiBase, dir === 'up' ? 1 : 0, dir === 'down' ? 1 : 0)
  })
  return scores.length > 0 ? Math.min(...scores) : 50
}

/**
 * Compute a single taste number for one vote (for chart display).
 * Maps binary thumbs to a 0-100 scale.
 */
export function computeVoteTaste(
  tasteVote: 'up' | 'down' | undefined | null,
): number {
  if (tasteVote === 'up') return 75
  if (tasteVote === 'down') return 25
  return 50
}
