/**
 * Gamification Configuration
 * Points, badges, and streak definitions for the G-Matrix app
 */

export const POINTS = {
  VOTE: 10,
  NEW_PRODUCT: 25,
  ADD_PRICE: 5,
  TAG_STORE: 10,
  ADD_GPS: 5,
  STREAK_BONUS: 15, // 3+ day streak
} as const

export const VOTE_WEIGHTS = {
  REGISTERED: 2, // Registered users have 2x vote weight
  ANONYMOUS: 1, // Anonymous users have 1x vote weight
} as const

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  threshold: number
  type: 'votes' | 'gps' | 'stores' | 'streak' | 'products'
}

export const BADGES: Badge[] = [
  {
    id: 'first_scout',
    name: 'First Scout',
    description: 'Cast your first vote',
    icon: '🎯',
    threshold: 1,
    type: 'votes',
  },
  {
    id: 'trailblazer',
    name: 'Trailblazer',
    description: 'Cast 10 votes',
    icon: '🚀',
    threshold: 10,
    type: 'votes',
  },
  {
    id: 'century_scout',
    name: 'Century Scout',
    description: 'Cast 100 votes',
    icon: '💯',
    threshold: 100,
    type: 'votes',
  },
  {
    id: 'location_pro',
    name: 'Location Pro',
    description: 'Add GPS location to 5 votes',
    icon: '📍',
    threshold: 5,
    type: 'gps',
  },
  {
    id: 'store_hunter',
    name: 'Store Hunter',
    description: 'Tag 5 different stores',
    icon: '🏪',
    threshold: 5,
    type: 'stores',
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Maintain a 7-day voting streak',
    icon: '🔥',
    threshold: 7,
    type: 'streak',
  },
  {
    id: 'product_pioneer',
    name: 'Product Pioneer',
    description: 'Add 5 new products',
    icon: '⭐',
    threshold: 5,
    type: 'products',
  },
]

/**
 * Calculate points earned for a vote
 */
export function calculateVotePoints(args: {
  hasPrice?: boolean
  hasStore?: boolean
  hasGPS?: boolean
  isNewProduct?: boolean
  streak?: number
}): number {
  let points = POINTS.VOTE

  if (args.hasPrice) points += POINTS.ADD_PRICE
  if (args.hasStore) points += POINTS.TAG_STORE
  if (args.hasGPS) points += POINTS.ADD_GPS
  if (args.isNewProduct) points += POINTS.NEW_PRODUCT
  if (args.streak && args.streak >= 3) points += POINTS.STREAK_BONUS

  return points
}

/**
 * Check if a badge should be awarded
 */
export function shouldAwardBadge(
  badge: Badge,
  currentBadges: string[],
  stats: {
    totalVotes?: number
    gpsVotes?: number
    storesTagged?: number
    streak?: number
    productsCreated?: number
  }
): boolean {
  // Already has badge
  if (currentBadges.includes(badge.id)) return false

  switch (badge.type) {
    case 'votes':
      return (stats.totalVotes ?? 0) >= badge.threshold
    case 'gps':
      return (stats.gpsVotes ?? 0) >= badge.threshold
    case 'stores':
      return (stats.storesTagged ?? 0) >= badge.threshold
    case 'streak':
      return (stats.streak ?? 0) >= badge.threshold
    case 'products':
      return (stats.productsCreated ?? 0) >= badge.threshold
    default:
      return false
  }
}
