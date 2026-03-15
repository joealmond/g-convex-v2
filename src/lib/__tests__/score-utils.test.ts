import { describe, it, expect } from 'vitest'
import {
  computeAllergenScore,
  computeAllergenScoreFromData,
  computeSafetyDisplayMeta,
  computePersonalizedSafety,
  computeTasteScore,
  deriveAllergenConfidence,
  deriveAllergenState,
  deriveSafetyDisplayState,
  buildInitialAllergenScores,
  computeUniversalSafety,
  type AllergenScoresMap,
  type AiBase,
} from '../score-utils'

// ─── computeAllergenScore ────────────────────────────────────────────────────

describe('computeAllergenScore', () => {
  it('returns 67 for free-from with zero community votes', () => {
    expect(computeAllergenScore('free-from', 0, 0)).toBe(67)
  })

  it('returns 0 for contains with zero community votes', () => {
    expect(computeAllergenScore('contains', 0, 0)).toBe(0)
  })

  it('returns 50 for unknown with zero community votes', () => {
    expect(computeAllergenScore('unknown', 0, 0)).toBe(50)
  })

  it('community votes override AI classification (contains + many thumbs up)', () => {
    // contains = 0 virtual up, 2 virtual down
    // 15 up, 2 down → (0+15)/(0+2+15+2) = 15/19 ≈ 79
    const score = computeAllergenScore('contains', 15, 2)
    expect(score).toBe(79)
  })

  it('community votes can flag AI free-from as unsafe', () => {
    // free-from = 2 virtual up, 1 virtual down
    // 0 up, 5 down → (2+0)/(2+1+0+5) = 2/8 = 25
    const score = computeAllergenScore('free-from', 0, 5)
    expect(score).toBe(25)
  })

  it('equal community votes on unknown stay near 50', () => {
    // unknown = 1 up, 1 down
    // 5 up, 5 down → (1+5)/(1+1+5+5) = 6/12 = 50
    const score = computeAllergenScore('unknown', 5, 5)
    expect(score).toBe(50)
  })

  it('large community vote count dominates AI prior', () => {
    // contains = 0 up, 2 down
    // 100 up, 0 down → (0+100)/(0+2+100+0) = 100/102 ≈ 98
    const score = computeAllergenScore('contains', 100, 0)
    expect(score).toBe(98)
  })
})

// ─── computeAllergenScoreFromData ────────────────────────────────────────────

describe('computeAllergenScoreFromData', () => {
  it('delegates to computeAllergenScore correctly', () => {
    const data = { aiBase: 'free-from' as AiBase, upVotes: 3, downVotes: 1 }
    const score = computeAllergenScoreFromData(data)
    // free-from = 2 virtual up, 1 virtual down → (2+3)/(2+1+3+1) = 5/7 ≈ 71
    expect(score).toBe(71)
  })
})

// ─── deriveAllergenState ────────────────────────────────────────────────────

describe('deriveAllergenState', () => {
  it('returns likely-unsafe for scores at or below 25', () => {
    expect(deriveAllergenState(25, 100)).toBe('likely-unsafe')
    expect(deriveAllergenState(0, 0)).toBe('likely-unsafe')
  })

  it('returns uncertain until both likely-safe conditions are met', () => {
    expect(deriveAllergenState(26, 100)).toBe('uncertain')
    expect(deriveAllergenState(79, 100)).toBe('uncertain')
    expect(deriveAllergenState(80, 4)).toBe('uncertain')
  })

  it('returns likely-safe only when score and vote threshold are both met', () => {
    expect(deriveAllergenState(80, 5)).toBe('likely-safe')
    expect(deriveAllergenState(93, 12)).toBe('likely-safe')
  })
})

// ─── deriveAllergenConfidence ───────────────────────────────────────────────

describe('deriveAllergenConfidence', () => {
  it('returns low for 0 to 2 votes', () => {
    expect(deriveAllergenConfidence(0)).toBe('low')
    expect(deriveAllergenConfidence(2)).toBe('low')
  })

  it('returns medium for 3 to 9 votes', () => {
    expect(deriveAllergenConfidence(3)).toBe('medium')
    expect(deriveAllergenConfidence(9)).toBe('medium')
  })

  it('returns high for 10 or more votes', () => {
    expect(deriveAllergenConfidence(10)).toBe('high')
    expect(deriveAllergenConfidence(42)).toBe('high')
  })
})

// ─── deriveSafetyDisplayState ──────────────────────────────────────────────

describe('deriveSafetyDisplayState', () => {
  it('maps uncertain states to needs-review', () => {
    expect(deriveSafetyDisplayState(67, 0)).toBe('needs-review')
    expect(deriveSafetyDisplayState(80, 4)).toBe('needs-review')
  })

  it('preserves likely-safe and likely-unsafe states', () => {
    expect(deriveSafetyDisplayState(92, 12)).toBe('likely-safe')
    expect(deriveSafetyDisplayState(25, 3)).toBe('likely-unsafe')
  })
})

// ─── computePersonalizedSafety ───────────────────────────────────────────────

describe('computePersonalizedSafety', () => {
  const allergenScores: AllergenScoresMap = {
    gluten: { aiBase: 'free-from', upVotes: 10, downVotes: 0 }, // score ≈ 92
    milk: { aiBase: 'contains', upVotes: 0, downVotes: 0 },     // score = 0
    soy: { aiBase: 'unknown', upVotes: 0, downVotes: 0 },       // score = 50
    nuts: { aiBase: 'free-from', upVotes: 5, downVotes: 0 },    // score = 88
    eggs: { aiBase: 'free-from', upVotes: 0, downVotes: 0 },    // score = 67
  }

  it('returns min of user avoided allergens', () => {
    // User avoids gluten & milk → min(~100, 0) = 0
    const score = computePersonalizedSafety(allergenScores, ['gluten', 'milk'])
    expect(score).toBe(0)
  })

  it('returns high score if user only avoids safe allergens', () => {
    // User avoids only gluten → min(~92) = 92
    const score = computePersonalizedSafety(allergenScores, ['gluten'])
    expect(score).toBe(92)
  })

  it('returns min of ALL allergens when no profile', () => {
    // No avoided allergens → worst-case = min(all scores) = 0 (milk contains)
    const score = computePersonalizedSafety(allergenScores, [])
    expect(score).toBe(0)
  })

  it('returns 50 for null/undefined allergenScores', () => {
    expect(computePersonalizedSafety(null, ['gluten'])).toBe(50)
    expect(computePersonalizedSafety(undefined, ['gluten'])).toBe(50)
  })

  it('returns 50 for empty allergenScores', () => {
    expect(computePersonalizedSafety({}, ['gluten'])).toBe(50)
  })

  it('skips allergens not in product scores', () => {
    // User avoids 'sesame' which isn't in the product → skipped
    // Only returns 50 (no relevant scores)
    const score = computePersonalizedSafety(allergenScores, ['sesame'])
    expect(score).toBe(50)
  })

  it('handles mixed known and unknown avoided allergens', () => {
    // User avoids gluten (in product, score ~92) + sesame (not in product)
    // Only gluten is relevant → returns ~92
    const score = computePersonalizedSafety(allergenScores, ['gluten', 'sesame'])
    expect(score).toBe(92)
  })
})

// ─── computeSafetyDisplayMeta ───────────────────────────────────────────────

describe('computeSafetyDisplayMeta', () => {
  const allergenScores: AllergenScoresMap = {
    gluten: { aiBase: 'contains', upVotes: 18, downVotes: 2 },
    milk: { aiBase: 'free-from', upVotes: 12, downVotes: 0 },
    soy: { aiBase: 'unknown', upVotes: 0, downVotes: 0 },
  }

  it('returns the limiting score for relevant allergens', () => {
    expect(computeSafetyDisplayMeta(allergenScores, ['milk', 'soy'])).toEqual({
      score: 50,
      voteCount: 0,
      allergenId: 'soy',
      aiBase: 'unknown',
    })
  })

  it('falls back to the worst-case score across all allergens when no profile exists', () => {
    expect(computeSafetyDisplayMeta(allergenScores, [])).toEqual({
      score: 50,
      voteCount: 0,
      allergenId: 'soy',
      aiBase: 'unknown',
    })
  })

  it('returns unknown defaults when no relevant allergen data exists', () => {
    expect(computeSafetyDisplayMeta(allergenScores, ['nuts'])).toEqual({
      score: 50,
      voteCount: 0,
      allergenId: null,
      aiBase: null,
    })
  })
})

// ─── computeTasteScore ───────────────────────────────────────────────────────

describe('computeTasteScore', () => {
  it('returns 50 with zero votes (neutral start)', () => {
    expect(computeTasteScore(0, 0)).toBe(50)
  })

  it('increases toward 100 with all up votes', () => {
    // (1+10)/(2+10+0) = 11/12 ≈ 92
    expect(computeTasteScore(10, 0)).toBe(92)
  })

  it('decreases toward 0 with all down votes', () => {
    // (1+0)/(2+0+10) = 1/12 ≈ 8
    expect(computeTasteScore(0, 10)).toBe(8)
  })

  it('stays near 50 with equal votes', () => {
    // (1+5)/(2+5+5) = 6/12 = 50
    expect(computeTasteScore(5, 5)).toBe(50)
  })

  it('approaches 100 asymptotically with many up votes', () => {
    // (1+1000)/(2+1000+0) = 1001/1002 ≈ 100
    expect(computeTasteScore(1000, 0)).toBe(100)
  })
})

// ─── buildInitialAllergenScores ──────────────────────────────────────────────

describe('buildInitialAllergenScores', () => {
  const knownIds = ['gluten', 'milk', 'soy', 'nuts', 'eggs']

  it('classifies allergens correctly from arrays', () => {
    const scores = buildInitialAllergenScores(
      ['gluten', 'milk'],  // contains
      ['soy', 'nuts'],     // free-from
      knownIds,
    )

    expect(scores.gluten?.aiBase).toBe('contains')
    expect(scores.milk?.aiBase).toBe('contains')
    expect(scores.soy?.aiBase).toBe('free-from')
    expect(scores.nuts?.aiBase).toBe('free-from')
    expect(scores.eggs?.aiBase).toBe('unknown')
  })

  it('initializes all community votes to 0', () => {
    const scores = buildInitialAllergenScores(['gluten'], ['soy'], knownIds)
    for (const data of Object.values(scores)) {
      expect(data.upVotes).toBe(0)
      expect(data.downVotes).toBe(0)
    }
  })

  it('handles empty/undefined inputs', () => {
    const scores = buildInitialAllergenScores(undefined, undefined, knownIds)
    // All should be unknown
    for (const data of Object.values(scores)) {
      expect(data.aiBase).toBe('unknown')
    }
  })

  it('is case-insensitive', () => {
    const scores = buildInitialAllergenScores(['Gluten', 'MILK'], ['Soy'], knownIds)
    expect(scores.gluten?.aiBase).toBe('contains')
    expect(scores.milk?.aiBase).toBe('contains')
    expect(scores.soy?.aiBase).toBe('free-from')
  })

  it('creates an entry for every known allergen', () => {
    const scores = buildInitialAllergenScores([], [], knownIds)
    expect(Object.keys(scores)).toEqual(knownIds)
  })
})

// ─── computeUniversalSafety ─────────────────────────────────────────────────

describe('computeUniversalSafety', () => {
  it('returns 50 for null/undefined/empty', () => {
    expect(computeUniversalSafety(null)).toBe(50)
    expect(computeUniversalSafety(undefined)).toBe(50)
    expect(computeUniversalSafety({})).toBe(50)
  })

  it('returns lowest of all allergen scores', () => {
    const scores: AllergenScoresMap = {
      gluten: { aiBase: 'free-from', upVotes: 0, downVotes: 0 }, // 67
      milk: { aiBase: 'contains', upVotes: 0, downVotes: 0 },     // 0
    }
    expect(computeUniversalSafety(scores)).toBe(0)
  })

  it('returns 67 when all allergens are free-from with zero community votes', () => {
    const scores: AllergenScoresMap = {
      gluten: { aiBase: 'free-from', upVotes: 0, downVotes: 0 },
      milk: { aiBase: 'free-from', upVotes: 0, downVotes: 0 },
    }
    expect(computeUniversalSafety(scores)).toBe(67)
  })
})
