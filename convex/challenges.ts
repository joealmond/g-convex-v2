/**
 * Community Challenges System
 * 
 * Hybrid system: Auto-generated templates + admin customization
 * Challenges motivate user engagement with rewards (points, badges)
 */

import { v } from 'convex/values'
import { internalMutation, mutation, query } from './_generated/server'
import { requireAuth, getAuthUser } from './lib/authHelpers'
import { internal } from './_generated/api'

/**
 * Get all active challenges
 */
export const getActiveChallenges = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    
    return await ctx.db
      .query('challenges')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .filter((q) => 
        q.and(
          q.lte(q.field('startDate'), now),
          q.gte(q.field('endDate'), now)
        )
      )
      .collect()
  },
})

/**
 * Get user's progress on a specific challenge
 */
export const getUserChallengeProgress = query({
  args: { challengeId: v.id('challenges') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    if (!user) return null
    
    const userChallenge = await ctx.db
      .query('userChallenges')
      .withIndex('by_user_and_challenge', (q) => 
        q.eq('userId', user._id).eq('challengeId', args.challengeId)
      )
      .first()
    
    return userChallenge || null
  },
})

/**
 * Get all user's challenge progress
 */
export const getUserChallenges = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx)
    if (!user) return []
    
    return await ctx.db
      .query('userChallenges')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()
  },
})

/**
 * Update user's progress on a challenge
 * Called automatically when user performs relevant actions (vote, add product, etc.)
 */
export const updateChallengeProgress = internalMutation({
  args: {
    userId: v.string(),
    challengeType: v.string(), // "vote" | "product" | "streak" | "store"
    incrementBy: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    // Get active challenges of this type
    const challenges = await ctx.db
      .query('challenges')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .filter((q) => 
        q.and(
          q.eq(q.field('type'), args.challengeType),
          q.lte(q.field('startDate'), now),
          q.gte(q.field('endDate'), now)
        )
      )
      .collect()
    
    // Update progress for each matching challenge
    for (const challenge of challenges) {
      const existing = await ctx.db
        .query('userChallenges')
        .withIndex('by_user_and_challenge', (q) => 
          q.eq('userId', args.userId).eq('challengeId', challenge._id)
        )
        .first()
      
      if (existing && !existing.completed) {
        const newProgress = existing.progress + (args.incrementBy || 1)
        const completed = newProgress >= challenge.targetValue
        
        await ctx.db.patch(existing._id, {
          progress: newProgress,
          completed,
          completedAt: completed ? now : undefined,
          updatedAt: now,
        })
        
        // Award points if just completed
        if (completed && !existing.completed) {
          await ctx.runMutation(internal.profiles.addPointsInternal, {
            userId: args.userId,
            points: challenge.rewardPoints,
            reason: `Completed challenge: ${challenge.title}`,
          })
        }
      } else if (!existing) {
        // Create new tracking entry
        const progress = args.incrementBy || 1
        const completed = progress >= challenge.targetValue
        
        await ctx.db.insert('userChallenges', {
          userId: args.userId,
          challengeId: challenge._id,
          progress,
          completed,
          completedAt: completed ? now : undefined,
          rewardClaimed: false,
          createdAt: now,
          updatedAt: now,
        })
        
        // Award points if completed on first action
        if (completed) {
          await ctx.runMutation(internal.profiles.addPointsInternal, {
            userId: args.userId,
            points: challenge.rewardPoints,
            reason: `Completed challenge: ${challenge.title}`,
          })
        }
      }
    }
  },
})

/**
 * Claim reward for completed challenge
 */
export const claimReward = mutation({
  args: { challengeId: v.id('challenges') },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    
    const userChallenge = await ctx.db
      .query('userChallenges')
      .withIndex('by_user_and_challenge', (q) => 
        q.eq('userId', user._id).eq('challengeId', args.challengeId)
      )
      .first()
    
    if (!userChallenge) {
      throw new Error('Challenge not started')
    }
    
    if (!userChallenge.completed) {
      throw new Error('Challenge not completed yet')
    }
    
    if (userChallenge.rewardClaimed) {
      throw new Error('Reward already claimed')
    }
    
    // Mark as claimed
    await ctx.db.patch(userChallenge._id, {
      rewardClaimed: true,
      updatedAt: Date.now(),
    })
    
    const challenge = await ctx.db.get(args.challengeId)
    if (!challenge) throw new Error('Challenge not found')
    
    // Award points (if not already awarded in updateChallengeProgress)
    // This is a fallback for manual claiming
    return {
      points: challenge.rewardPoints,
      badge: challenge.rewardBadge,
    }
  },
})

/**
 * Admin: Create custom challenge
 */
export const createChallenge = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal('vote'),
      v.literal('product'),
      v.literal('streak'),
      v.literal('store')
    ),
    targetValue: v.number(),
    rewardPoints: v.number(),
    rewardBadge: v.optional(v.string()),
    durationDays: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    
    // Check admin permission (you may want to add this to authHelpers)
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first()
    
    if (profile?.role !== 'admin') {
      throw new Error('Admin permission required')
    }
    
    const now = Date.now()
    const endDate = now + (args.durationDays * 24 * 60 * 60 * 1000)
    
    return await ctx.db.insert('challenges', {
      title: args.title,
      description: args.description,
      type: args.type,
      targetValue: args.targetValue,
      rewardPoints: args.rewardPoints,
      rewardBadge: args.rewardBadge,
      startDate: now,
      endDate,
      isActive: true,
      isTemplate: false, // Admin-created, not auto-generated
      createdBy: user._id,
      createdAt: now,
    })
  },
})

/**
 * Generate weekly auto-challenges
 * Called by weekly cron job
 */
export const resetWeeklyChallenges = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const oneWeek = 7 * 24 * 60 * 60 * 1000
    
    // Deactivate old template challenges
    const oldChallenges = await ctx.db
      .query('challenges')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .filter((q) => q.eq(q.field('isTemplate'), true))
      .collect()
    
    for (const challenge of oldChallenges) {
      await ctx.db.patch(challenge._id, { isActive: false })
    }
    
    // Create new template challenges
    const templates: Array<{
      title: string
      description: string
      type: 'vote' | 'product' | 'streak' | 'store'
      targetValue: number
      rewardPoints: number
      rewardBadge?: string
    }> = [
      {
        title: 'Vote 10 Times',
        description: 'Cast 10 votes on products this week',
        type: 'vote',
        targetValue: 10,
        rewardPoints: 50,
      },
      {
        title: 'Add 2 Products',
        description: 'Contribute 2 new products to the community',
        type: 'product',
        targetValue: 2,
        rewardPoints: 100,
      },
      {
        title: 'Maintain 7-Day Streak',
        description: 'Vote every day for 7 days in a row',
        type: 'streak',
        targetValue: 7,
        rewardPoints: 150,
        rewardBadge: 'streak-master',
      },
      {
        title: 'Tag 5 Stores',
        description: 'Help others find products by tagging 5 store locations',
        type: 'store',
        targetValue: 5,
        rewardPoints: 75,
      },
    ]
    
    for (const template of templates) {
      await ctx.db.insert('challenges', {
        ...template,
        startDate: now,
        endDate: now + oneWeek,
        isActive: true,
        isTemplate: true,
        createdAt: now,
      })
    }
  },
})
