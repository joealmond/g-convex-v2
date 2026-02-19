import { v } from 'convex/values'
import { query, mutation, internalMutation, internalQuery } from './_generated/server'
import { BADGES, shouldAwardBadge } from './lib/gamification'
import { requireAdmin } from './lib/authHelpers'

/**
 * Get user profile by userId
 */
export const get = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()
  },
})

/**
 * Get current user's profile (read-only, returns null if doesn't exist)
 */
export const getCurrent = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const userId = identity.subject

    return await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()
  },
})

/**
 * Ensure current user has a profile (creates if doesn't exist)
 */
export const ensureProfile = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const userId = identity.subject

    let profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (!profile) {
      // Create profile on first access
      const profileId = await ctx.db.insert('profiles', {
        userId,
        points: 0,
        badges: [],
        streak: 0,
        totalVotes: 0,
      })
      profile = await ctx.db.get(profileId)
    }

    return profile
  },
})

/**
 * Get leaderboard (top users by points)
 * Supports cursor-based pagination for large user bases
 */
export const leaderboard = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { limit = 10, cursor }) => {
    if (cursor !== undefined) {
      // Paginated mode
      const result = await ctx.db
        .query('profiles')
        .withIndex('by_points')
        .order('desc')
        .paginate({ cursor: cursor ?? null, numItems: limit })
      return result
    }
    // Simple mode (backward compat)
    return await ctx.db
      .query('profiles')
      .withIndex('by_points')
      .order('desc')
      .take(limit)
  },
})

/**
 * Check and award badges for a user
 * Note: userId is a string because Better Auth uses string UUIDs, not Convex IDs
 */
export const checkBadges = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (!profile) return { newBadges: [] }

    // Get user stats
    const votes = await ctx.db
      .query('votes')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    const gpsVotes = votes.filter((v) => v.latitude !== undefined).length
    const uniqueStores = new Set(
      votes.filter((v) => v.storeName).map((v) => v.storeName)
    ).size

    const products = await ctx.db.query('products').collect()
    const productsCreated = products.filter((p) => p.createdBy === userId).length

    const stats = {
      totalVotes: profile.totalVotes,
      gpsVotes,
      storesTagged: uniqueStores,
      streak: profile.streak,
      productsCreated,
    }

    // Check each badge
    const newBadges: string[] = []
    for (const badge of BADGES) {
      if (shouldAwardBadge(badge, profile.badges, stats)) {
        newBadges.push(badge.id)
      }
    }

    // Award new badges
    if (newBadges.length > 0) {
      await ctx.db.patch(profile._id, {
        badges: [...profile.badges, ...newBadges],
      })
    }

    return { newBadges }
  },
})

/**
 * Manually add points to a user (admin only)
 * Note: userId is a string because Better Auth uses string UUIDs, not Convex IDs
 */
export const addPoints = mutation({
  args: {
    userId: v.string(),
    points: v.number(),
  },
  handler: async (ctx, { userId, points }) => {
    await requireAdmin(ctx)

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (!profile) {
      throw new Error('Profile not found')
    }

    await ctx.db.patch(profile._id, {
      points: Math.max(0, profile.points + points),
    })
  },
})

/**
 * Reset user streak (for testing)
 * Note: userId is a string because Better Auth uses string UUIDs, not Convex IDs
 */
export const resetStreak = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx)

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (!profile) {
      throw new Error('Profile not found')
    }

    await ctx.db.patch(profile._id, {
      streak: 0,
      lastVoteDate: undefined,
    })
  },
})

/**
 * Internal mutation to add points (for challenges and automated rewards)
 * No auth check since this is called by internal mutations
 */
export const addPointsInternal = internalMutation({
  args: {
    userId: v.string(),
    points: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { userId, points, reason }) => {
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (!profile) {
      throw new Error('Profile not found')
    }

    await ctx.db.patch(profile._id, {
      points: Math.max(0, profile.points + points),
    })
    
    if (reason) {
      console.log(`Awarded ${points} points to ${userId}: ${reason}`)
    }
  },
})

/**
 * Get all profiles with active streaks (3+ days) for reminder notifications.
 * Internal query used by streak reminder cron.
 */
export const getActiveStreakers = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Fetch all profiles with streak >= 3
    const allProfiles = await ctx.db.query('profiles').collect()
    
    return allProfiles.filter((profile) => 
      profile.streak && profile.streak >= 3 && profile.lastVoteDate
    )
  },
})
