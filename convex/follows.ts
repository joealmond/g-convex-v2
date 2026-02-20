import { publicQuery, publicMutation } from './lib/customFunctions'
import { v } from 'convex/values'

import { components } from './_generated/api'
import { RateLimiter } from '@convex-dev/rate-limiter'
import { getAuthUser } from './lib/authHelpers'
import { followsByFollower, followsByFollowing } from './aggregates'

const rateLimiter = new RateLimiter(components.rateLimiter, {
  follow: { kind: 'token bucket', rate: 20, period: 60000, capacity: 30 },
})

// Follow a user
export const follow = publicMutation({
  args: {
    followingId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    if (!user) {
      throw new Error('Must be logged in to follow users')
    }

    // Can't follow yourself
    if (user._id === args.followingId) {
      throw new Error('Cannot follow yourself')
    }

    // Rate limiting
    const { ok, retryAfter } = await rateLimiter.limit(ctx, 'follow', {
      key: user._id,
    })
    if (!ok) {
      throw new Error(
        `Rate limit exceeded. Please try again in ${Math.ceil(retryAfter / 1000)} seconds.`
      )
    }

    // Check if already following
    const existing = await ctx.db
      .query('follows')
      .withIndex('by_relationship', (q) =>
        q.eq('followerId', user._id).eq('followingId', args.followingId)
      )
      .first()

    if (existing) {
      throw new Error('Already following this user')
    }

    // Create follow
    const followId = await ctx.db.insert('follows', {
      followerId: user._id,
      followingId: args.followingId,
      createdAt: Date.now(),
    })
    
    const followDoc = await ctx.db.get(followId)
    if (followDoc) {
      await followsByFollower.insert(ctx, followDoc)
      await followsByFollowing.insert(ctx, followDoc)
    }
  },
})

// Unfollow a user
export const unfollow = publicMutation({
  args: {
    followingId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    if (!user) {
      throw new Error('Must be logged in to unfollow users')
    }

    // Find existing follow relationship
    const existing = await ctx.db
      .query('follows')
      .withIndex('by_relationship', (q) =>
        q.eq('followerId', user._id).eq('followingId', args.followingId)
      )
      .first()

    if (!existing) {
      throw new Error('Not following this user')
    }

    // Delete follow
    const docToDelete = await ctx.db.get(existing._id)
    await ctx.db.delete(existing._id)
    if (docToDelete) {
      await followsByFollower.delete(ctx, docToDelete)
      await followsByFollowing.delete(ctx, docToDelete)
    }
  },
})

// Check if current user is following a specific user
export const isFollowing = publicQuery({
  args: {
    followingId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    if (!user) {
      return false
    }

    const existing = await ctx.db
      .query('follows')
      .withIndex('by_relationship', (q) =>
        q.eq('followerId', user._id).eq('followingId', args.followingId)
      )
      .first()

    return !!existing
  },
})

// Get users that a specific user is following
export const getFollowing = publicQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query('follows')
      .withIndex('by_follower', (q) => q.eq('followerId', args.userId))
      .collect()

    return follows.map((f) => f.followingId)
  },
})

// Get followers of a specific user
export const getFollowers = publicQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query('follows')
      .withIndex('by_following', (q) => q.eq('followingId', args.userId))
      .collect()

    return follows.map((f) => f.followerId)
  },
})

// Get follower/following counts for a user
// Optimized: uses indexed queries with early termination limit
export const getCounts = publicQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const [followersCount, followingCount] = await Promise.all([
      followsByFollowing.count(ctx, { namespace: args.userId }),
      followsByFollower.count(ctx, { namespace: args.userId }),
    ])

    return {
      followers: followersCount,
      following: followingCount,
    }
  },
})
