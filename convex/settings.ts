/**
 * Admin Settings Management
 * 
 * Configurable parameters for time-decay, crons, challenges, etc.
 */

import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

/**
 * Get a single setting by key
 */
export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first()
    
    return setting?.value ?? null
  },
})

/**
 * Get all settings
 */
export const getAllSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query('settings').collect()
    
    // Convert to key-value object
    const settingsObj: Record<string, string | number | boolean> = {}
    for (const setting of settings) {
      settingsObj[setting.key] = setting.value
    }
    
    // Add defaults for missing settings
    const defaults: Record<string, string | number | boolean> = {
      TIME_DECAY_ENABLED: true,
      DECAY_RATE: 0.995, // 0.5% per day
      DECAY_HOUR: 0, // Midnight UTC
      PRICE_SNAPSHOT_ENABLED: true,
      CHALLENGE_POINTS_BASE: 50,
    }
    
    return { ...defaults, ...settingsObj }
  },
})

/**
 * Update a setting (admin only)
 */
export const updateSetting = mutation({
  args: {
    key: v.string(),
    value: v.union(v.string(), v.number(), v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Must be logged in')
    }

    // Check admin permission
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .first()
    
    if (profile?.role !== 'admin') {
      throw new Error('Admin permission required')
    }

    const existing = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first()
    
    const now = Date.now()
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedBy: identity.subject,
        updatedAt: now,
      })
      return existing._id
    } else {
      return await ctx.db.insert('settings', {
        key: args.key,
        value: args.value,
        updatedBy: identity.subject,
        updatedAt: now,
      })
    }
  },
})

/**
 * Batch update settings (admin only)
 */
export const updateSettings = mutation({
  args: {
    settings: v.array(v.object({
      key: v.string(),
      value: v.union(v.string(), v.number(), v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Must be logged in')
    }

    // Check admin permission
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .first()
    
    if (profile?.role !== 'admin') {
      throw new Error('Admin permission required')
    }

    const now = Date.now()
    
    for (const setting of args.settings) {
      const existing = await ctx.db
        .query('settings')
        .withIndex('by_key', (q) => q.eq('key', setting.key))
        .first()
      
      if (existing) {
        await ctx.db.patch(existing._id, {
          value: setting.value,
          updatedBy: identity.subject,
          updatedAt: now,
        })
      } else {
        await ctx.db.insert('settings', {
          key: setting.key,
          value: setting.value,
          updatedBy: identity.subject,
          updatedAt: now,
        })
      }
    }
  },
})
