import { describe, expect, it } from 'vitest'

import { BADGES, POINTS, calculateVotePoints } from './gamification'

describe('client gamification helpers', () => {
  it('calculates vote points with stacked bonuses', () => {
    expect(
      calculateVotePoints({
        hasPrice: true,
        hasStore: true,
        hasGPS: true,
        isNewProduct: true,
        streak: 5,
      }),
    ).toBe(
      POINTS.VOTE +
        POINTS.ADD_PRICE +
        POINTS.TAG_STORE +
        POINTS.ADD_GPS +
        POINTS.NEW_PRODUCT +
        POINTS.STREAK_BONUS,
    )
  })

  it('keeps badge ids unique', () => {
    const ids = BADGES.map((badge) => badge.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})