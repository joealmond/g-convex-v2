import { v } from 'convex/values'
import { query, mutation, internalMutation, internalQuery } from './_generated/server'
import { internal, components } from './_generated/api'
import { RateLimiter } from '@convex-dev/rate-limiter'
import { isAdmin } from './lib/authHelpers'
import { authMutation } from './lib/customFunctions'
import { votesByProduct } from './aggregates'
import type { Id } from './_generated/dataModel'

const rateLimiter = new RateLimiter(components.rateLimiter, {
  vote: { kind: 'token bucket', rate: 10, period: 60000, capacity: 15 },
  newProduct: { kind: 'token bucket', rate: 5, period: 3600000, capacity: 10 },
})

/**
 * Get all votes for a product
 */
export const getByProduct = query({
  args: { productId: v.id('products') },
  handler: async (ctx, { productId }) => {
    return await ctx.db
      .query('votes')
      .withIndex('by_product', (q) => q.eq('productId', productId))
      .collect()
  },
})

/**
 * Get all votes by a user
 * Note: userId is a string because Better Auth uses string UUIDs, not Convex IDs
 */
export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('votes')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
  },
})

/**
 * Get votes by anonymous ID
 */
export const getByAnonymous = query({
  args: { anonymousId: v.string() },
  handler: async (ctx, { anonymousId }) => {
    return await ctx.db
      .query('votes')
      .withIndex('by_anonymous', (q) => q.eq('anonymousId', anonymousId))
      .collect()
  },
})

/**
 * Cast a vote for a product
 */
export const cast = mutation({
  args: {
    productId: v.id('products'),
    anonymousId: v.optional(v.string()),
    safety: v.number(),
    taste: v.number(),
    price: v.optional(v.number()),
    storeName: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject ?? undefined
    const isAnonymous = !userId

    // Rate limiting
    const rateLimitKey = userId ?? args.anonymousId ?? 'unknown'
    const { ok, retryAfter } = await rateLimiter.limit(ctx, 'vote', {
      key: rateLimitKey,
    })

    if (!ok) {
      throw new Error(
        `Rate limit exceeded. Please try again in ${Math.ceil(retryAfter / 1000)} seconds.`
      )
    }

    // Validate vote values
    if (args.safety < 0 || args.safety > 100) {
      throw new Error('Safety must be between 0 and 100')
    }
    if (args.taste < 0 || args.taste > 100) {
      throw new Error('Taste must be between 0 and 100')
    }
    if (args.price !== undefined && (args.price < 1 || args.price > 5)) {
      throw new Error('Price must be between 1 and 5')
    }

    // Check if user already voted for this product
    let existingVote
    if (userId) {
      existingVote = await ctx.db
        .query('votes')
        .withIndex('by_product_user', (q) => q.eq('productId', args.productId).eq('userId', userId))
        .first()
    } else if (args.anonymousId) {
      existingVote = await ctx.db
        .query('votes')
        .withIndex('by_product', (q) => q.eq('productId', args.productId))
        .filter((q) => q.eq(q.field('anonymousId'), args.anonymousId))
        .first()
    }

    let voteId
    if (existingVote) {
      // Update existing vote
      const oldVote = await ctx.db.get(existingVote._id)
      await ctx.db.patch(existingVote._id, {
        safety: args.safety,
        taste: args.taste,
        price: args.price,
        storeName: args.storeName,
        latitude: args.latitude,
        longitude: args.longitude,
      })
      const newVote = await ctx.db.get(existingVote._id)
      if (oldVote && newVote) await votesByProduct.replace(ctx, oldVote, newVote)
      voteId = existingVote._id
    } else {
      // Create new vote
      voteId = await ctx.db.insert('votes', {
        productId: args.productId,
        userId: userId,
        anonymousId: args.anonymousId,
        isAnonymous,
        safety: args.safety,
        taste: args.taste,
        price: args.price,
        storeName: args.storeName,
        latitude: args.latitude,
        longitude: args.longitude,
        createdAt: Date.now(),
      })
      const newVoteDoc = await ctx.db.get(voteId)
      if (newVoteDoc) await votesByProduct.insert(ctx, newVoteDoc)
    }

    // Side effects: recalculate average, gamification, and push notifications
    await ctx.scheduler.runAfter(0, internal.sideEffects.onVoteCast, {
      userId: userId,
      productId: args.productId,
      voteId: voteId,
      hasGps: args.latitude !== undefined && args.longitude !== undefined,
      isNewProduct: false,
      hasPrice: args.price !== undefined,
      hasStore: !!args.storeName,
      isEdit: !!existingVote,
    })

    // Trigger "new product near you" notifications if GPS provided
    // This isn't strictly gamification, so it stays separate or can be moved to sideEffects later
    if (args.latitude !== undefined && args.longitude !== undefined && !existingVote) {
      await ctx.scheduler.runAfter(0, internal.actions.nearbyProduct.notifyNearbyProduct, {
        productId: args.productId.toString(),
        productName: 'A product',
        latitude: args.latitude,
        longitude: args.longitude,
        createdBy: userId,
      })
    }

    return voteId
  },
})

/**
 * Create a new product and cast the initial vote atomically
 * Awards bonus points for discovering a new product
 */
export const createProductAndVote = mutation({
  args: {
    name: v.string(),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id('_storage')),
    backImageUrl: v.optional(v.string()),
    ingredients: v.optional(v.array(v.string())),
    anonymousId: v.optional(v.string()),
    safety: v.number(),
    taste: v.number(),
    price: v.optional(v.number()),
    storeName: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    currency: v.optional(v.string()),
    purchaseLocation: v.optional(v.string()),
    // AI analysis data (optional)
    aiAnalysis: v.optional(v.object({
      productName: v.string(),
      reasoning: v.string(),
      safety: v.number(),
      taste: v.number(),
      tags: v.array(v.string()),
      containsGluten: v.boolean(),
      warnings: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject ?? undefined
    const isAnonymous = !userId

    // Rate limiting for new products
    const rateLimitKey = userId ?? args.anonymousId ?? 'unknown'
    const { ok, retryAfter } = await rateLimiter.limit(ctx, 'newProduct', {
      key: rateLimitKey,
    })

    if (!ok) {
      throw new Error(
        `Rate limit exceeded. Please try again in ${Math.ceil(retryAfter / 1000)} seconds.`
      )
    }

    // Check if product with same name exists
    const existingProduct = await ctx.db
      .query('products')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .first()

    if (existingProduct) {
      throw new Error('A product with this name already exists')
    }

    // Validate vote values
    if (args.safety < 0 || args.safety > 100) {
      throw new Error('Safety must be between 0 and 100')
    }
    if (args.taste < 0 || args.taste > 100) {
      throw new Error('Taste must be between 0 and 100')
    }

    const now = Date.now()

    // Create the product
    const productId = await ctx.db.insert('products', {
      name: args.name,
      imageUrl: args.imageUrl,
      imageStorageId: args.imageStorageId,
      backImageUrl: args.backImageUrl,
      ingredients: args.ingredients ?? args.aiAnalysis?.tags,
      averageSafety: args.safety,
      averageTaste: args.taste,
      avgPrice: args.price,
      voteCount: 1,
      registeredVotes: isAnonymous ? 0 : 1,
      anonymousVotes: isAnonymous ? 1 : 0,
      lastUpdated: now,
      createdBy: userId,
      createdAt: now,
      currency: args.currency,
      purchaseLocation: args.purchaseLocation,
      stores: (args.storeName || (args.latitude && args.longitude)) ? [{
        name: args.storeName || "Unknown Location",
        lastSeenAt: now,
        price: args.price,
        geoPoint: args.latitude && args.longitude 
          ? { lat: args.latitude, lng: args.longitude }
          : undefined,
      }] : undefined,
    })

    // Create the initial vote
    const voteId = await ctx.db.insert('votes', {
      productId,
      userId,
      anonymousId: args.anonymousId,
      isAnonymous,
      safety: args.safety,
      taste: args.taste,
      price: args.price,
      storeName: args.storeName,
      latitude: args.latitude,
      longitude: args.longitude,
      createdAt: now,
    })
    const newVoteDoc = await ctx.db.get(voteId)
    if (newVoteDoc) await votesByProduct.insert(ctx, newVoteDoc)

    // Side effects: recalculate average, gamification, challenge progress, etc.
    await ctx.scheduler.runAfter(0, internal.sideEffects.onVoteCast, {
      userId: userId,
      productId: productId,
      voteId: voteId,
      hasGps: args.latitude !== undefined && args.longitude !== undefined,
      isNewProduct: true,
      hasPrice: args.price !== undefined,
      hasStore: !!args.storeName,
      isEdit: false,
    })

    // Trigger "new product near you" notifications if GPS provided
    if (args.latitude !== undefined && args.longitude !== undefined) {
      await ctx.scheduler.runAfter(0, internal.actions.nearbyProduct.notifyNearbyProduct, {
        productId: productId.toString(),
        productName: args.name,
        latitude: args.latitude,
        longitude: args.longitude,
        createdBy: userId,
      })
    }

    return { productId, voteId }
  },
})

/**
 * Internal mutation to recalculate product averages
 * Supports time-decay: older votes have less weight using exponential decay
 */
export const recalculateProduct = internalMutation({
  args: { 
    productId: v.id('products'),
    applyTimeDecay: v.optional(v.boolean()),
  },
  handler: async (ctx, { productId, applyTimeDecay = false }) => {
    const votes = await ctx.db
      .query('votes')
      .withIndex('by_product', (q) => q.eq('productId', productId))
      .collect()

    if (votes.length === 0) {
      await ctx.db.patch(productId, {
        averageSafety: 50,
        averageTaste: 50,
        avgPrice: undefined,
        voteCount: 0,
        registeredVotes: 0,
        anonymousVotes: 0,
        lastUpdated: Date.now(),
      })
      return
    }

    // Get decay rate from settings (default 0.995 = 0.5% per day)
    let decayRate = 0.995
    if (applyTimeDecay) {
      const decayRateSetting = await ctx.db
        .query('settings')
        .withIndex('by_key', (q) => q.eq('key', 'DECAY_RATE'))
        .first()
      if (decayRateSetting && typeof decayRateSetting.value === 'number') {
        decayRate = decayRateSetting.value
      }
    }

    let totalWeightSafety = 0
    let totalWeightTaste = 0
    let totalWeightPrice = 0
    let weightedSafetySum = 0
    let weightedTasteSum = 0
    let weightedPriceSum = 0
    let registeredCount = 0
    let anonymousCount = 0

    const REGISTERED_WEIGHT = 2
    const ANONYMOUS_WEIGHT = 1
    const now = Date.now()

    for (const vote of votes) {
      let baseWeight = vote.isAnonymous ? ANONYMOUS_WEIGHT : REGISTERED_WEIGHT
      
      // Apply time-decay if enabled
      if (applyTimeDecay) {
        const ageInDays = (now - vote.createdAt) / (1000 * 60 * 60 * 24)
        const timeDecay = Math.pow(decayRate, ageInDays)
        baseWeight = baseWeight * timeDecay
      }

      weightedSafetySum += vote.safety * baseWeight
      totalWeightSafety += baseWeight

      weightedTasteSum += vote.taste * baseWeight
      totalWeightTaste += baseWeight

      if (vote.price !== undefined) {
        weightedPriceSum += vote.price * baseWeight
        totalWeightPrice += baseWeight
      }

      if (vote.isAnonymous) {
        anonymousCount++
      } else {
        registeredCount++
      }
    }

    await ctx.db.patch(productId, {
      averageSafety: weightedSafetySum / totalWeightSafety,
      averageTaste: weightedTasteSum / totalWeightTaste,
      avgPrice: totalWeightPrice > 0 ? weightedPriceSum / totalWeightPrice : undefined,
      voteCount: votes.length,
      registeredVotes: registeredCount,
      anonymousVotes: anonymousCount,
      lastUpdated: Date.now(),
    })
  },
})

/**
 * Recalculate all products with time-decay
 * Called by daily cron job
 * Processes products in batches to avoid mutation time limits
 */
export const recalculateAllProducts = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if time-decay is enabled
    const enabledSetting = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', 'TIME_DECAY_ENABLED'))
      .first()
    
    const isEnabled = enabledSetting?.value === true || enabledSetting?.value === 'true'
    if (!isEnabled) {
      console.log('Time-decay is disabled, skipping recalculation')
      return
    }

    const products = await ctx.db.query('products').collect()
    const BATCH_SIZE = 25

    // Process first batch inline
    const firstBatch = products.slice(0, BATCH_SIZE)
    for (const product of firstBatch) {
      await ctx.runMutation(internal.votes.recalculateProduct, {
        productId: product._id,
        applyTimeDecay: true,
      })
    }

    // Schedule remaining batches
    for (let i = BATCH_SIZE; i < products.length; i += BATCH_SIZE) {
      const batchIds = products.slice(i, i + BATCH_SIZE).map((p) => p._id)
      // Stagger batches by 1 second each to spread load
      await ctx.scheduler.runAfter((i / BATCH_SIZE) * 1000, internal.votes.recalculateProductBatch, {
        productIds: batchIds,
      })
    }
    
    console.log(`Recalculating ${products.length} products with time-decay (batches of ${BATCH_SIZE})`)
  },
})

/**
 * Internal mutation to recalculate a batch of products
 * Used by recalculateAllProducts to process in smaller chunks
 */
export const recalculateProductBatch = internalMutation({
  args: { productIds: v.array(v.id('products')) },
  handler: async (ctx, { productIds }) => {
    for (const productId of productIds) {
      await ctx.runMutation(internal.votes.recalculateProduct, {
        productId,
        applyTimeDecay: true,
      })
    }
    console.log(`Batch recalculated ${productIds.length} products`)
  },
})

/**
 * Migrate anonymous votes to registered user
 * Called when user signs in
 */
export const migrateAnonymous = authMutation({
  args: { anonymousId: v.string() },
  handler: async (ctx, { anonymousId }) => {
    const userId = ctx.userId

    // Find all anonymous votes
    const anonVotes = await ctx.db
      .query('votes')
      .withIndex('by_anonymous', (q) => q.eq('anonymousId', anonymousId))
      .collect()

    const affectedProducts = new Set<Id<'products'>>()

    for (const vote of anonVotes) {
      // Check if user already has a vote for this product
      const existingVote = await ctx.db
        .query('votes')
        .withIndex('by_product_user', (q) => q.eq('productId', vote.productId).eq('userId', userId))
        .first()

      if (existingVote) {
        // User already voted, delete anonymous vote
        const oldVote = await ctx.db.get(vote._id)
        await ctx.db.delete(vote._id)
        if (oldVote) await votesByProduct.delete(ctx, oldVote)
      } else {
        // Migrate vote to user
        const oldVote = await ctx.db.get(vote._id)
        await ctx.db.patch(vote._id, {
          userId: userId,
          anonymousId: undefined,
          isAnonymous: false,
        })
        const newVote = await ctx.db.get(vote._id)
        if (oldVote && newVote) await votesByProduct.replace(ctx, oldVote, newVote)
      }

      affectedProducts.add(vote.productId)
    }

    // Recalculate averages for affected products
    for (const productId of affectedProducts) {
      await ctx.scheduler.runAfter(0, internal.votes.recalculateProduct, {
        productId: productId,
      })
    }

    return { migratedCount: anonVotes.length }
  },
})

/**
 * Delete a vote (user's own or admin)
 */
export const deleteVote = authMutation({
  args: { voteId: v.id('votes') },
  handler: async (ctx, { voteId }) => {
    const vote = await ctx.db.get(voteId)

    if (!vote) {
      throw new Error('Vote not found')
    }

    // Check if user owns the vote or is admin
    const userId = ctx.userId
    const isOwner = vote.userId === userId
    const hasAdminAccess = isAdmin(ctx.user)

    if (!isOwner && !hasAdminAccess) {
      throw new Error('Not authorized to delete this vote')
    }

    const docToDelete = await ctx.db.get(voteId)
    const productId = vote.productId
    await ctx.db.delete(voteId)
    if (docToDelete) await votesByProduct.delete(ctx, docToDelete)

    // Recalculate product averages
    await ctx.scheduler.runAfter(0, internal.votes.recalculateProduct, {
      productId,
    })
  },
})

/**
 * Get all votes with GPS coordinates (internal query for nearby product notifications).
 * Only returns votes from registered users with GPS data.
 */
export const getVotesWithGPS = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allVotes = await ctx.db.query('votes').collect()
    
    return allVotes.filter((vote) => 
      vote.latitude !== undefined && 
      vote.longitude !== undefined && 
      vote.userId !== undefined // Only registered users (can receive push notifications)
    )
  },
})
