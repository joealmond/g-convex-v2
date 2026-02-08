import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getAuthUser } from './lib/authHelpers'

// Follow a user
export const follow = mutation({
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
    await ctx.db.insert('follows', {
      followerId: user._id,
      followingId: args.followingId,
      createdAt: Date.now(),
    })
  },
})

// Unfollow a user
export const unfollow = mutation({
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
    await ctx.db.delete(existing._id)
  },
})

// Check if current user is following a specific user
export const isFollowing = query({
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
export const getFollowing = query({
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
export const getFollowers = query({
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
export const getCounts = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const [followers, following] = await Promise.all([
      ctx.db
        .query('follows')
        .withIndex('by_following', (q) => q.eq('followingId', args.userId))
        .collect(),
      ctx.db
        .query('follows')
        .withIndex('by_follower', (q) => q.eq('followerId', args.userId))
        .collect(),
    ])

    return {
      followers: followers.length,
      following: following.length,
    }
  },
})
