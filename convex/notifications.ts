/**
 * Push Notification Token Management
 *
 * Stores and removes device tokens for push notifications.
 * Actual push delivery requires an external service (Firebase Cloud Messaging
 * for Android, APNs for iOS). See docs/PUSH_NOTIFICATIONS_SETUP.md for
 * integration instructions.
 */
import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

/**
 * Register a device token for push notifications.
 * Upserts: if the token already exists for this user, updates lastUsedAt.
 */
export const registerToken = mutation({
  args: {
    userId: v.string(),
    token: v.string(),
    platform: v.union(v.literal('ios'), v.literal('android'), v.literal('web')),
  },
  handler: async (ctx, { userId, token, platform }) => {
    // Check if token already exists
    const existing = await ctx.db
      .query('deviceTokens')
      .withIndex('by_token', (q) => q.eq('token', token))
      .first()

    if (existing) {
      // Update lastUsedAt
      await ctx.db.patch(existing._id, {
        lastUsedAt: Date.now(),
        userId, // Re-associate if transferred to new user
        platform,
      })
      return existing._id
    }

    // Insert new token
    return await ctx.db.insert('deviceTokens', {
      userId,
      token,
      platform,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    })
  },
})

/**
 * Remove a device token (e.g., on sign-out or permission revoke).
 */
export const removeToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    const existing = await ctx.db
      .query('deviceTokens')
      .withIndex('by_token', (q) => q.eq('token', token))
      .first()

    if (existing) {
      await ctx.db.delete(existing._id)
    }
  },
})

/**
 * Get all device tokens for a user (admin use / debugging).
 */
export const getTokensByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('deviceTokens')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
  },
})
