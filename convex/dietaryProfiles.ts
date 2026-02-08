/**
 * Dietary Profiles
 * 
 * Multi-condition dietary restrictions with per-condition severity levels.
 * Examples: Celiac-Severe (5), Lactose-Moderate (3)
 */

import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAuth } from './lib/authHelpers'

/**
 * Get user's dietary profile
 */
export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx)
    
    const profile = await ctx.db
      .query('dietaryProfiles')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first()
    
    return profile || null
  },
})

/**
 * Update user's dietary profile
 */
export const updateProfile = mutation({
  args: {
    conditions: v.array(v.object({
      type: v.string(),
      severity: v.number(), // 1-5
    })),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    
    // Validate severity levels
    for (const condition of args.conditions) {
      if (condition.severity < 1 || condition.severity > 5) {
        throw new Error('Severity must be between 1 and 5')
      }
    }
    
    const existing = await ctx.db
      .query('dietaryProfiles')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first()
    
    const now = Date.now()
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        conditions: args.conditions,
        updatedAt: now,
      })
      return existing._id
    } else {
      return await ctx.db.insert('dietaryProfiles', {
        userId: user._id,
        conditions: args.conditions,
        createdAt: now,
        updatedAt: now,
      })
    }
  },
})

/**
 * Get safety threshold for a user based on their dietary profile
 * Returns minimum safety score products must meet
 * 
 * Thresholds by severity:
 * 1 (Mild): 40
 * 2 (Low-Moderate): 50
 * 3 (Moderate): 60
 * 4 (High-Moderate): 70
 * 5 (Severe): 80
 */
export const getSafetyThreshold = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = args.userId || (await requireAuth(ctx))._id
    
    const profile = await ctx.db
      .query('dietaryProfiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()
    
    if (!profile || profile.conditions.length === 0) {
      return 0 // No filtering
    }
    
    // Use the highest severity (most restrictive)
    const maxSeverity = Math.max(...profile.conditions.map(c => c.severity))
    
    // Map severity to threshold
    const thresholds: Record<number, number> = {
      1: 40,
      2: 50,
      3: 60,
      4: 70,
      5: 80,
    }
    
    return thresholds[maxSeverity] || 0
  },
})
