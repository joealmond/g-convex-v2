import { v } from 'convex/values'

import { internal, components } from './_generated/api'
import { RateLimiter } from '@convex-dev/rate-limiter'
import { isAdmin } from './lib/authHelpers'
import { authMutation, publicQuery, publicMutation, internalQuery, internalMutation } from './lib/customFunctions'
import { votesByProduct } from './aggregates'
import { productsGeo } from './geospatial'
import type { Id } from './_generated/dataModel'
import {
  VALID_ALLERGEN_IDS,
  buildInitialAllergenScores,
  aggregateAllergenVotes,
  aggregateTasteVotes,
  computeUniversalSafety,
  computeTasteScore,
  computeVoteSafety,
  computeVoteTaste,
} from './lib/scoreUtils'
import type { AllergenScoresMap } from './lib/scoreUtils'

const rateLimiter = new RateLimiter(components.rateLimiter, {
  vote: { kind: 'token bucket', rate: 10, period: 60000, capacity: 15 },
  newProduct: { kind: 'token bucket', rate: 5, period: 3600000, capacity: 10 },
})

/**
 * Get all votes for a product
 */
export const getByProduct = publicQuery({
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
export const getByUser = publicQuery({
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
export const getByAnonymous = publicQuery({
  args: { anonymousId: v.string() },
  handler: async (ctx, { anonymousId }) => {
    return await ctx.db
      .query('votes')
      .withIndex('by_anonymous', (q) => q.eq('anonymousId', anonymousId))
      .collect()
  },
})

/**
 * Cast a vote for a product (new thumbs-based system)
 */
export const cast = publicMutation({
  args: {
    productId: v.id('products'),
    anonymousId: v.optional(v.string()),
    // Thumbs-based voting fields
    allergenVotes: v.optional(v.record(v.string(), v.union(v.literal('up'), v.literal('down')))),
    tasteVote: v.optional(v.union(v.literal('up'), v.literal('down'))),
    // Price: subjective scale + optional exact price
    price: v.optional(v.number()),
    exactPrice: v.optional(v.object({ amount: v.number(), currency: v.string() })),
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

    // Validate allergen vote IDs
    if (args.allergenVotes) {
      for (const allergenId of Object.keys(args.allergenVotes)) {
        if (!VALID_ALLERGEN_IDS.includes(allergenId as typeof VALID_ALLERGEN_IDS[number])) {
          throw new Error(`Invalid allergen ID: ${allergenId}`)
        }
      }
    }

    // Must provide at least one vote dimension
    if (!args.allergenVotes && !args.tasteVote) {
      throw new Error('Must provide at least one vote (allergenVotes or tasteVote)')
    }

    if (args.price !== undefined && (args.price < 1 || args.price > 5)) {
      throw new Error('Price must be between 1 and 5')
    }

    const product = await ctx.db.get(args.productId)
    if (!product) {
      throw new Error('Product not found')
    }

    if (userId && product.createdBy && product.createdBy === userId) {
      throw new Error('You cannot vote on your own product')
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

    const productScores = (product?.allergenScores ?? undefined) as AllergenScoresMap | undefined
    const voteSafety = computeVoteSafety(args.allergenVotes, productScores)
    const voteTaste = computeVoteTaste(args.tasteVote)

    if (existingVote) {
      // Update existing vote
      const oldVote = await ctx.db.get(existingVote._id)
      await ctx.db.patch(existingVote._id, {
        allergenVotes: args.allergenVotes,
        tasteVote: args.tasteVote,
        safety: voteSafety,
        taste: voteTaste,
        price: args.price,
        exactPrice: args.exactPrice,
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
        allergenVotes: args.allergenVotes,
        tasteVote: args.tasteVote,
        safety: voteSafety,
        taste: voteTaste,
        price: args.price,
        exactPrice: args.exactPrice,
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
    // Also index the product geospatially if it doesn't have coordinates yet
    if (args.latitude !== undefined && args.longitude !== undefined && !existingVote) {
      // Update product's geospatial index if it lacks coordinates
      const product = await ctx.db.get(args.productId)
      if (product && (product.latitude === undefined || product.longitude === undefined)) {
        await ctx.db.patch(args.productId, {
          latitude: args.latitude,
          longitude: args.longitude,
        })
        await productsGeo.insert(ctx, args.productId, {
          latitude: args.latitude,
          longitude: args.longitude,
        }, {})
      }

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
 * Awards bonus points for discovering a new product.
 * AI analysis initializes per-allergen safety scores.
 */
export const createProductAndVote = publicMutation({
  args: {
    name: v.string(),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id('_storage')),
    backImageUrl: v.optional(v.string()),
    ingredients: v.optional(v.array(v.string())),
    anonymousId: v.optional(v.string()),
    // New thumbs-based vote fields
    allergenVotes: v.optional(v.record(v.string(), v.union(v.literal('up'), v.literal('down')))),
    tasteVote: v.optional(v.union(v.literal('up'), v.literal('down'))),
    price: v.optional(v.number()),
    exactPrice: v.optional(v.object({ amount: v.number(), currency: v.string() })),
    storeName: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    currency: v.optional(v.string()),
    purchaseLocation: v.optional(v.string()),
    // Allergens detected from barcode or AI
    allergens: v.optional(v.array(v.string())),
    // Sensitivity: what the product is FREE FROM
    freeFrom: v.optional(v.array(v.string())),
    // Raw OCR text from back-of-package ingredient label
    ingredientsText: v.optional(v.string()),
    // Back image storage reference
    backImageStorageId: v.optional(v.id('_storage')),
    backImageUrl2: v.optional(v.string()),
    // AI analysis data (optional)
    aiAnalysis: v.optional(v.object({
      productName: v.string(),
      reasoning: v.string(),
      safety: v.number(),
      taste: v.number(),
      tags: v.array(v.string()),
      containsGluten: v.boolean(),
      warnings: v.array(v.string()),
      suggestedFreeFrom: v.optional(v.array(v.string())),
    })),
    // Barcode & product metadata from OpenFoodFacts
    barcode: v.optional(v.string()),
    barcodeSource: v.optional(v.string()),
    brand: v.optional(v.string()),
    category: v.optional(v.string()),
    nutritionScore: v.optional(v.string()),
    // Data source tier: where the allergen classification came from
    dataSource: v.optional(v.union(
      v.literal('openfoodfacts'),
      v.literal('ai-ingredients'),
      v.literal('ai-estimate'),
      v.literal('community'),
    )),
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

    const now = Date.now()

    // Merge allergens from barcode/user input + AI analysis
    const mergedAllergens = new Set<string>(
      (args.allergens ?? []).map(a => a.toLowerCase())
    )
    if (args.aiAnalysis?.containsGluten) {
      mergedAllergens.add('gluten')
    }
    const allergens = mergedAllergens.size > 0 ? [...mergedAllergens] : undefined

    // Merge freeFrom suggestions
    const mergedFreeFrom = new Set<string>(
      (args.freeFrom ?? []).map(a => a.toLowerCase())
    )
    if (args.aiAnalysis?.suggestedFreeFrom) {
      for (const ff of args.aiAnalysis.suggestedFreeFrom) {
        mergedFreeFrom.add(ff.toLowerCase())
      }
    }
    const freeFrom = mergedFreeFrom.size > 0 ? [...mergedFreeFrom] : undefined

    // ─── Build initial per-allergen scores from AI data ─────────
    const allergenScores = buildInitialAllergenScores(
      allergens,
      freeFrom,
      VALID_ALLERGEN_IDS,
    )

    // Apply initial vote's allergen votes if provided
    if (args.allergenVotes) {
      for (const [allergenId, direction] of Object.entries(args.allergenVotes)) {
        if (allergenScores[allergenId]) {
          if (direction === 'up') {
            allergenScores[allergenId]!.upVotes += 1
          } else {
            allergenScores[allergenId]!.downVotes += 1
          }
        }
      }
    }

    // Compute initial scores for the product
    const initialSafety = computeUniversalSafety(allergenScores)
    const initialTasteUp = args.tasteVote === 'up' ? 1 : 0
    const initialTasteDown = args.tasteVote === 'down' ? 1 : 0
    const initialTaste = computeTasteScore(initialTasteUp, initialTasteDown)

    // Create the product
    const productId = await ctx.db.insert('products', {
      name: args.name,
      imageUrl: args.imageUrl,
      imageStorageId: args.imageStorageId,
      backImageUrl: args.backImageUrl ?? args.backImageUrl2,
      backImageStorageId: args.backImageStorageId,
      ingredients: args.ingredients ?? args.aiAnalysis?.tags,
      ingredientsText: args.ingredientsText,
      freeFrom,
      allergens,
      allergenScores,
      tasteUpVotes: initialTasteUp,
      tasteDownVotes: initialTasteDown,
      barcode: args.barcode,
      barcodeSource: args.barcodeSource,
      brand: args.brand,
      category: args.category,
      nutritionScore: args.nutritionScore,
      dataSource: args.dataSource,
      averageSafety: initialSafety,
      averageTaste: initialTaste,
      avgPrice: args.price,
      exactPrices: args.exactPrice ? [{
        amount: args.exactPrice.amount,
        currency: args.exactPrice.currency,
        storeName: args.storeName,
      }] : undefined,
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

    // Create the initial vote (with computed convenience scores for chart display)
    const voteSafety = computeVoteSafety(args.allergenVotes, allergenScores)
    const voteTaste = computeVoteTaste(args.tasteVote)
    const voteId = await ctx.db.insert('votes', {
      productId,
      userId,
      anonymousId: args.anonymousId,
      isAnonymous,
      allergenVotes: args.allergenVotes,
      tasteVote: args.tasteVote,
      safety: voteSafety,
      taste: voteTaste,
      price: args.price,
      exactPrice: args.exactPrice,
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

    // Index product in geospatial index if GPS coordinates are provided
    if (args.latitude !== undefined && args.longitude !== undefined) {
      // Also store lat/lng on the product document itself
      await ctx.db.patch(productId, {
        latitude: args.latitude,
        longitude: args.longitude,
      })
      await productsGeo.insert(ctx, productId, {
        latitude: args.latitude,
        longitude: args.longitude,
      }, {})

      // Trigger "new product near you" notifications
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
 * Uses per-allergen vote aggregation + taste thumbs + price average.
 * Maintains backward-compatible averageSafety/averageTaste fields.
 */
export const recalculateProduct = internalMutation({
  args: { 
    productId: v.id('products'),
    applyTimeDecay: v.optional(v.boolean()),
  },
  handler: async (ctx, { productId, applyTimeDecay = false }) => {
    const product = await ctx.db.get(productId)
    if (!product) return

    const votes = await ctx.db
      .query('votes')
      .withIndex('by_product', (q) => q.eq('productId', productId))
      .collect()

    if (votes.length === 0) {
      await ctx.db.patch(productId, {
        averageSafety: computeUniversalSafety(product.allergenScores),
        averageTaste: 50, // neutral with no votes
        avgPrice: undefined,
        tasteUpVotes: 0,
        tasteDownVotes: 0,
        voteCount: 0,
        registeredVotes: 0,
        anonymousVotes: 0,
        lastUpdated: Date.now(),
      })
      return
    }

    // ─── Aggregate per-allergen votes ───────────────────────────
    const allergenScores = aggregateAllergenVotes(
      product.allergenScores ?? undefined,
      votes.map(v => ({
        allergenVotes: v.allergenVotes ?? undefined,
      })),
    )

    // ─── Aggregate taste votes ──────────────────────────────
    const tasteAgg = aggregateTasteVotes(
      votes.map(v => ({
        tasteVote: v.tasteVote ?? undefined,
      })),
    )

    // ─── Calculate price (weighted average like before) ─────────
    let totalWeightPrice = 0
    let weightedPriceSum = 0
    let registeredCount = 0
    let anonymousCount = 0

    const REGISTERED_WEIGHT = 2
    const ANONYMOUS_WEIGHT = 1
    const now = Date.now()

    // Get decay rate from settings if needed
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

    // Collect exact prices for the product
    const exactPrices: Array<{ amount: number; currency: string; storeName?: string }> = []

    for (const vote of votes) {
      let baseWeight = vote.isAnonymous ? ANONYMOUS_WEIGHT : REGISTERED_WEIGHT
      
      if (applyTimeDecay) {
        const ageInDays = (now - vote.createdAt) / (1000 * 60 * 60 * 24)
        const timeDecay = Math.pow(decayRate, ageInDays)
        baseWeight = baseWeight * timeDecay
      }

      if (vote.price !== undefined) {
        weightedPriceSum += vote.price * baseWeight
        totalWeightPrice += baseWeight
      }

      if (vote.exactPrice) {
        exactPrices.push({
          amount: vote.exactPrice.amount,
          currency: vote.exactPrice.currency,
          storeName: vote.storeName ?? undefined,
        })
      }

      if (vote.isAnonymous) {
        anonymousCount++
      } else {
        registeredCount++
      }
    }

    // ─── Compute backward-compatible scores ─────────────────────
    const universalSafety = computeUniversalSafety(allergenScores)
    const tasteScore = computeTasteScore(tasteAgg.upVotes, tasteAgg.downVotes)

    await ctx.db.patch(productId, {
      allergenScores,
      tasteUpVotes: tasteAgg.upVotes,
      tasteDownVotes: tasteAgg.downVotes,
      averageSafety: universalSafety,
      averageTaste: tasteScore,
      avgPrice: totalWeightPrice > 0 ? weightedPriceSum / totalWeightPrice : undefined,
      exactPrices: exactPrices.length > 0 ? exactPrices : undefined,
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
    // Use DB-level filter to reduce data transferred from storage
    // Note: No index on lat/lng, but filter is pushed to the DB engine
    const votes = await ctx.db
      .query('votes')
      .filter((q) =>
        q.and(
          q.neq(q.field('latitude'), undefined),
          q.neq(q.field('longitude'), undefined),
          q.neq(q.field('userId'), undefined)
        )
      )
      .collect()
    
    return votes
  },
})
