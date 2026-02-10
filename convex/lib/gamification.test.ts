import { describe, it, expect } from 'vitest'
import {
  calculateVotePoints,
  shouldAwardBadge,
  BADGES,
  POINTS,
  Badge,
} from './gamification'

describe('calculateVotePoints', () => {
  it('returns base vote points for a basic vote', () => {
    expect(calculateVotePoints({})).toBe(POINTS.VOTE) // 10
  })

  it('adds price bonus', () => {
    expect(calculateVotePoints({ hasPrice: true })).toBe(
      POINTS.VOTE + POINTS.ADD_PRICE
    ) // 10 + 5 = 15
  })

  it('adds store bonus', () => {
    expect(calculateVotePoints({ hasStore: true })).toBe(
      POINTS.VOTE + POINTS.TAG_STORE
    ) // 10 + 10 = 20
  })

  it('adds GPS bonus', () => {
    expect(calculateVotePoints({ hasGPS: true })).toBe(
      POINTS.VOTE + POINTS.ADD_GPS
    ) // 10 + 5 = 15
  })

  it('adds new product bonus', () => {
    expect(calculateVotePoints({ isNewProduct: true })).toBe(
      POINTS.VOTE + POINTS.NEW_PRODUCT
    ) // 10 + 25 = 35
  })

  it('adds streak bonus for 3+ day streak', () => {
    expect(calculateVotePoints({ streak: 3 })).toBe(
      POINTS.VOTE + POINTS.STREAK_BONUS
    ) // 10 + 15 = 25
  })

  it('adds streak bonus for 7+ day streak', () => {
    expect(calculateVotePoints({ streak: 7 })).toBe(
      POINTS.VOTE + POINTS.STREAK_BONUS
    ) // 10 + 15 = 25
  })

  it('does NOT add streak bonus for streak < 3', () => {
    expect(calculateVotePoints({ streak: 2 })).toBe(POINTS.VOTE) // 10
    expect(calculateVotePoints({ streak: 1 })).toBe(POINTS.VOTE) // 10
    expect(calculateVotePoints({ streak: 0 })).toBe(POINTS.VOTE) // 10
  })

  it('stacks all bonuses together', () => {
    expect(
      calculateVotePoints({
        hasPrice: true,
        hasStore: true,
        hasGPS: true,
        isNewProduct: true,
        streak: 5,
      })
    ).toBe(
      POINTS.VOTE +
        POINTS.ADD_PRICE +
        POINTS.TAG_STORE +
        POINTS.ADD_GPS +
        POINTS.NEW_PRODUCT +
        POINTS.STREAK_BONUS
    ) // 10 + 5 + 10 + 5 + 25 + 15 = 70
  })

  it('handles undefined optional fields gracefully', () => {
    expect(
      calculateVotePoints({
        hasPrice: undefined,
        hasStore: undefined,
        hasGPS: undefined,
        isNewProduct: undefined,
        streak: undefined,
      })
    ).toBe(POINTS.VOTE) // 10
  })
})

describe('shouldAwardBadge', () => {
  const findBadge = (id: string) => BADGES.find((b) => b.id === id)!

  describe('vote badges', () => {
    it('awards first_scout badge after 1 vote', () => {
      const badge = findBadge('first_scout')
      expect(
        shouldAwardBadge(badge, [], { totalVotes: 1 })
      ).toBe(true)
    })

    it('does NOT award first_scout if already held', () => {
      const badge = findBadge('first_scout')
      expect(
        shouldAwardBadge(badge, ['first_scout'], { totalVotes: 10 })
      ).toBe(false)
    })

    it('does NOT award first_scout before 1 vote', () => {
      const badge = findBadge('first_scout')
      expect(
        shouldAwardBadge(badge, [], { totalVotes: 0 })
      ).toBe(false)
    })

    it('awards trailblazer after 10 votes', () => {
      const badge = findBadge('trailblazer')
      expect(
        shouldAwardBadge(badge, [], { totalVotes: 10 })
      ).toBe(true)
    })

    it('does NOT award trailblazer before 10 votes', () => {
      const badge = findBadge('trailblazer')
      expect(
        shouldAwardBadge(badge, [], { totalVotes: 9 })
      ).toBe(false)
    })

    it('awards century_scout after 100 votes', () => {
      const badge = findBadge('century_scout')
      expect(
        shouldAwardBadge(badge, [], { totalVotes: 100 })
      ).toBe(true)
    })
  })

  describe('gps badges', () => {
    it('awards location_pro after 5 GPS votes', () => {
      const badge = findBadge('location_pro')
      expect(
        shouldAwardBadge(badge, [], { gpsVotes: 5 })
      ).toBe(true)
    })

    it('does NOT award location_pro before 5 GPS votes', () => {
      const badge = findBadge('location_pro')
      expect(
        shouldAwardBadge(badge, [], { gpsVotes: 4 })
      ).toBe(false)
    })
  })

  describe('store badges', () => {
    it('awards store_hunter after 5 unique stores', () => {
      const badge = findBadge('store_hunter')
      expect(
        shouldAwardBadge(badge, [], { storesTagged: 5 })
      ).toBe(true)
    })

    it('does NOT award store_hunter before 5 stores', () => {
      const badge = findBadge('store_hunter')
      expect(
        shouldAwardBadge(badge, [], { storesTagged: 3 })
      ).toBe(false)
    })
  })

  describe('streak badges', () => {
    it('awards streak_master after 7-day streak', () => {
      const badge = findBadge('streak_master')
      expect(
        shouldAwardBadge(badge, [], { streak: 7 })
      ).toBe(true)
    })

    it('does NOT award streak_master before 7-day streak', () => {
      const badge = findBadge('streak_master')
      expect(
        shouldAwardBadge(badge, [], { streak: 6 })
      ).toBe(false)
    })
  })

  describe('product badges', () => {
    it('awards product_pioneer after 5 new products', () => {
      const badge = findBadge('product_pioneer')
      expect(
        shouldAwardBadge(badge, [], { productsCreated: 5 })
      ).toBe(true)
    })

    it('does NOT award product_pioneer before 5 products', () => {
      const badge = findBadge('product_pioneer')
      expect(
        shouldAwardBadge(badge, [], { productsCreated: 4 })
      ).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('returns false for already-held badges regardless of stats', () => {
      for (const badge of BADGES) {
        expect(
          shouldAwardBadge(badge, [badge.id], {
            totalVotes: 999,
            gpsVotes: 999,
            storesTagged: 999,
            streak: 999,
            productsCreated: 999,
          })
        ).toBe(false)
      }
    })

    it('handles empty stats object', () => {
      for (const badge of BADGES) {
        expect(shouldAwardBadge(badge, [], {})).toBe(false)
      }
    })

    it('handles undefined stats fields', () => {
      const badge = findBadge('first_scout')
      expect(
        shouldAwardBadge(badge, [], {
          totalVotes: undefined,
        })
      ).toBe(false)
    })
  })
})

describe('BADGES', () => {
  it('has unique IDs', () => {
    const ids = BADGES.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all badges have required fields', () => {
    for (const badge of BADGES) {
      expect(badge.id).toBeTruthy()
      expect(badge.name).toBeTruthy()
      expect(badge.description).toBeTruthy()
      expect(badge.icon).toBeTruthy()
      expect(badge.threshold).toBeGreaterThan(0)
      expect(['votes', 'gps', 'stores', 'streak', 'products']).toContain(
        badge.type
      )
    }
  })
})
