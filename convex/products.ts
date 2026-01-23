import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

/**
 * List all products
 * Sorted by most recently created
 */
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query('products').order('desc').collect()
  },
})

/**
 * Get a single product by ID
 */
export const get = query({
  args: { id: v.id('products') },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id)
  },
})

/**
 * Get a product by name
 */
export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    return await ctx.db
      .query('products')
      .withIndex('by_name', (q) => q.eq('name', name))
      .first()
  },
})

/**
 * Search products by name
 */
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    const allProducts = await ctx.db.query('products').collect()
    
    if (!query) return allProducts

    const searchLower = query.toLowerCase()
    return allProducts.filter((product) =>
      product.name.toLowerCase().includes(searchLower)
    )
  },
})

/**
 * Create a new product
 */
export const create = mutation({
  args: {
    name: v.string(),
    imageUrl: v.optional(v.string()),
    ingredients: v.optional(v.array(v.string())),
    initialSafety: v.optional(v.number()),
    initialTaste: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    
    // Check if product already exists
    const existing = await ctx.db
      .query('products')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .first()
    
    if (existing) {
      throw new Error('Product already exists')
    }

    const productId = await ctx.db.insert('products', {
      name: args.name,
      imageUrl: args.imageUrl,
      ingredients: args.ingredients,
      averageSafety: args.initialSafety ?? 50,
      averageTaste: args.initialTaste ?? 50,
      avgPrice: undefined,
      voteCount: 0,
      registeredVotes: 0,
      anonymousVotes: 0,
      lastUpdated: Date.now(),
      createdBy: identity?.subject,
      createdAt: Date.now(),
    })

    return productId
  },
})

/**
 * Update a product
 */
export const update = mutation({
  args: {
    id: v.id('products'),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    ingredients: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { id, ...updates }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Must be logged in to update products')
    }

    await ctx.db.patch(id, {
      ...updates,
      lastUpdated: Date.now(),
    })

    return id
  },
})

/**
 * Delete a product (admin only)
 */
export const deleteProduct = mutation({
  args: { id: v.id('products') },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Must be logged in to delete products')
    }

    // TODO: Add admin check from lib/authHelpers.ts
    
    // Delete all votes for this product
    const votes = await ctx.db
      .query('votes')
      .withIndex('by_product', (q) => q.eq('productId', id))
      .collect()
    
    for (const vote of votes) {
      await ctx.db.delete(vote._id)
    }

    await ctx.db.delete(id)
  },
})

/**
 * Recalculate weighted averages for a product
 * Called after votes are added/removed
 */
export const recalculateAverages = mutation({
  args: { productId: v.id('products') },
  handler: async (ctx, { productId }) => {
    const votes = await ctx.db
      .query('votes')
      .withIndex('by_product', (q) => q.eq('productId', productId))
      .collect()

    if (votes.length === 0) {
      // No votes, reset to defaults
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

    for (const vote of votes) {
      const weight = vote.isAnonymous ? ANONYMOUS_WEIGHT : REGISTERED_WEIGHT
      
      weightedSafetySum += vote.safety * weight
      totalWeightSafety += weight
      
      weightedTasteSum += vote.taste * weight
      totalWeightTaste += weight

      if (vote.price !== undefined) {
        weightedPriceSum += vote.price * weight
        totalWeightPrice += weight
      }

      if (vote.isAnonymous) {
        anonymousCount++
      } else {
        registeredCount++
      }
    }

    await ctx.db.patch(productId, {
      averageSafety: totalWeightSafety > 0 ? weightedSafetySum / totalWeightSafety : 50,
      averageTaste: totalWeightTaste > 0 ? weightedTasteSum / totalWeightTaste : 50,
      avgPrice: totalWeightPrice > 0 ? weightedPriceSum / totalWeightPrice : undefined,
      voteCount: votes.length,
      registeredVotes: registeredCount,
      anonymousVotes: anonymousCount,
      lastUpdated: Date.now(),
    })
  },
})
