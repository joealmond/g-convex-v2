import { describe, it, expect } from 'vitest'
import {
  computeAllergenScore,
  computeAllergenScoreFromData,
  computePersonalizedSafety,
  computeTasteScore,
  buildInitialAllergenScores,
  computeUniversalSafety,
  type AllergenScoresMap,
  type AiBase,
} from '../score-utils'

// ─── computeAllergenScore ────────────────────────────────────────────────────

describe('computeAllergenScore', () => {
  it('returns 100 for free-from with zero community votes', () => {
    expect(computeAllergenScore('free-from', 0, 0)).toBe(100)
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
    // free-from = 2 virtual up, 0 virtual down
    // 0 up, 5 down → (2+0)/(2+0+0+5) = 2/7 ≈ 29
    const score = computeAllergenScore('free-from', 0, 5)
    expect(score).toBe(29)
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
    // free-from = 2 virtual up → (2+3)/(2+0+3+1) = 5/6 ≈ 83
    expect(score).toBe(83)
  })
})

// ─── computePersonalizedSafety ───────────────────────────────────────────────

describe('computePersonalizedSafety', () => {
  const allergenScores: AllergenScoresMap = {
    gluten: { aiBase: 'free-from', upVotes: 10, downVotes: 0 }, // score ≈ 100
    milk: { aiBase: 'contains', upVotes: 0, downVotes: 0 },     // score = 0
    soy: { aiBase: 'unknown', upVotes: 0, downVotes: 0 },       // score = 50
    nuts: { aiBase: 'free-from', upVotes: 5, downVotes: 0 },    // score ≈ 100
    eggs: { aiBase: 'free-from', upVotes: 0, downVotes: 0 },    // score = 100
  }

  it('returns min of user avoided allergens', () => {
    // User avoids gluten & milk → min(~100, 0) = 0
    const score = computePersonalizedSafety(allergenScores, ['gluten', 'milk'])
    expect(score).toBe(0)
  })

  it('returns high score if user only avoids safe allergens', () => {
    // User avoids only gluten → min(~100) = 100
    const score = computePersonalizedSafety(allergenScores, ['gluten'])
    expect(score).toBe(100)
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
    // User avoids gluten (in product, score ~100) + sesame (not in product)
    // Only gluten is relevant → returns ~100
    const score = computePersonalizedSafety(allergenScores, ['gluten', 'sesame'])
    expect(score).toBe(100)
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
      gluten: { aiBase: 'free-from', upVotes: 0, downVotes: 0 }, // 100
      milk: { aiBase: 'contains', upVotes: 0, downVotes: 0 },     // 0
    }
    expect(computeUniversalSafety(scores)).toBe(0)
  })

  it('returns 100 when all allergens are free-from with zero community votes', () => {
    const scores: AllergenScoresMap = {
      gluten: { aiBase: 'free-from', upVotes: 0, downVotes: 0 },
      milk: { aiBase: 'free-from', upVotes: 0, downVotes: 0 },
    }
    expect(computeUniversalSafety(scores)).toBe(100)
  })
})
