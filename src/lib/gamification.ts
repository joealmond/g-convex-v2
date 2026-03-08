export const POINTS = {
  VOTE: 10,
  NEW_PRODUCT: 25,
  ADD_PRICE: 5,
  TAG_STORE: 10,
  ADD_GPS: 5,
  STREAK_BONUS: 15,
} as const

export interface BadgeMeta {
  id: string
  icon: string
  threshold: number
  type: 'votes' | 'gps' | 'stores' | 'streak' | 'products'
}

export const BADGES: BadgeMeta[] = [
  { id: 'first_scout', icon: '🎯', threshold: 1, type: 'votes' },
  { id: 'trailblazer', icon: '🚀', threshold: 10, type: 'votes' },
  { id: 'century_scout', icon: '💯', threshold: 100, type: 'votes' },
  { id: 'location_pro', icon: '📍', threshold: 5, type: 'gps' },
  { id: 'store_hunter', icon: '🏪', threshold: 5, type: 'stores' },
  { id: 'streak_master', icon: '🔥', threshold: 7, type: 'streak' },
  { id: 'product_pioneer', icon: '⭐', threshold: 5, type: 'products' },
] as const

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