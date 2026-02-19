import { internalMutation } from './_generated/server'
import { v } from 'convex/values'
import { internal, api } from './_generated/api'
import { POINTS } from './lib/gamification'

export const onVoteCast = internalMutation({
  args: {
    userId: v.optional(v.string()), // Better Auth user._id is a string
    productId: v.id('products'),
    voteId: v.id('votes'),
    hasGps: v.boolean(),
    isNewProduct: v.boolean(),
    hasPrice: v.boolean(),
    hasStore: v.boolean(),
    isEdit: v.boolean(),
  },
  handler: async (ctx, args) => {
    // 1. Recalculate Product Averages
    await ctx.scheduler.runAfter(0, internal.votes.recalculateProduct, {
      productId: args.productId,
    })

    if (args.isEdit) return // No gamification for edits

    // 2. Gamification / Profile updates
    if (args.userId) {
      let profile = await ctx.db
        .query('profiles')
        .withIndex('by_user', (q) => q.eq('userId', args.userId!))
        .first()

      if (!profile) {
        // Create profile if missing
        const profileId = await ctx.db.insert('profiles', {
          userId: args.userId,
          points: 0,
          badges: [],
          streak: 0,
          totalVotes: 0,
        })
        profile = await ctx.db.get(profileId)
      }

      if (!profile) return

      let pointsEarned = POINTS.VOTE
      if (args.hasGps) pointsEarned += POINTS.ADD_GPS
      if (args.hasPrice) pointsEarned += POINTS.ADD_PRICE
      if (args.hasStore) pointsEarned += POINTS.TAG_STORE
      if (args.isNewProduct) pointsEarned += POINTS.NEW_PRODUCT

      // Check streak
      const now = new Date()
      let newStreak = profile.streak
      if (profile.lastVoteDate) {
        const lastVote = new Date(profile.lastVoteDate)
        const diffDays = Math.floor((now.getTime() - lastVote.getTime()) / (1000 * 3600 * 24))
        
        if (diffDays === 1) {
          newStreak += 1 // Consecutive day
        } else if (diffDays > 1) {
          newStreak = 1 // Streak broken
        }
      } else {
        newStreak = 1 // First vote
      }

      const todayStr = now.toISOString().split('T')[0]

      const newProductVotes = args.isNewProduct ? (profile.newProductVotes ?? 0) + 1 : (profile.newProductVotes ?? 0)
      const gpsVotes = args.hasGps ? (profile.gpsVotes ?? 0) + 1 : (profile.gpsVotes ?? 0)

      await ctx.db.patch(profile._id, {
        points: profile.points + pointsEarned,
        totalVotes: profile.totalVotes + 1,
        streak: newStreak,
        lastVoteDate: todayStr,
        newProductVotes,
        gpsVotes,
      })
      
      // Async: check badges
      await ctx.scheduler.runAfter(0, api.profiles.checkBadges, {
        userId: args.userId,
      })

      // Update challenge progress
      await ctx.scheduler.runAfter(0, internal.challenges.updateChallengeProgress, {
        userId: args.userId,
        challengeType: 'vote',
        incrementBy: 1,
      })

      if (args.isNewProduct) {
        await ctx.scheduler.runAfter(0, internal.challenges.updateChallengeProgress, {
          userId: args.userId,
          challengeType: 'product',
          incrementBy: 1,
        })
      }

      // Update store challenge if store tagged
      if (args.hasStore) {
        await ctx.scheduler.runAfter(0, internal.challenges.updateChallengeProgress, {
          userId: args.userId,
          challengeType: 'store',
          incrementBy: 1,
        })
      }
    }
  },
})

export const onProductCreated = internalMutation({
  args: {
    productId: v.id('products'),
    creatorId: v.optional(v.string()),
  },
  handler: async (_ctx, _args) => {
    // Trigger any async logic for new product
    // e.g. Notify admins, AI categorizations, etc.
  },
})

export const onVoteDeleted = internalMutation({
  args: {
    productId: v.id('products'),
  },
  handler: async (ctx, args) => {
    // 1. Recalculate Product Averages
    await ctx.scheduler.runAfter(0, internal.votes.recalculateProduct, {
      productId: args.productId,
    })
  }
})
