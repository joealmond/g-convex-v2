import { v } from 'convex/values'
import { query, mutation, internalMutation } from './_generated/server'
import { components } from './_generated/api'
import { RateLimiter } from '@convex-dev/rate-limiter'
import { requireAuth, requireAdmin } from './lib/authHelpers'

const rateLimiter = new RateLimiter(components.rateLimiter, {
  productUpdate: { kind: 'token bucket', rate: 10, period: 60000, capacity: 15 },
})

/**
 * List all products with cursor-based pagination
 * Sorted by most recently created
 */
export const list = query({
  args: {
    paginationOpts: v.optional(v.object({
      cursor: v.optional(v.union(v.string(), v.null())),
      numItems: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const numItems = args.paginationOpts?.numItems ?? 50
    const result = await ctx.db
      .query('products')
      .order('desc')
      .paginate({ cursor: args.paginationOpts?.cursor ?? null, numItems })

    const pageWithImages = await Promise.all(
      result.page.map(async (p) => {
        if (p.imageStorageId) {
          return { ...p, imageUrl: await ctx.storage.getUrl(p.imageStorageId) ?? p.imageUrl }
        }
        return p
      })
    )

    return {
      ...result,
      page: pageWithImages,
    }
  },
})

/**
 * List all products (no pagination, for backward compat)
 * @deprecated Use list() with paginationOpts instead
 */
export const listAll = query({
  handler: async (ctx) => {
    const products = await ctx.db.query('products').order('desc').collect()
    return await Promise.all(products.map(async (p) => {
      if (p.imageStorageId) {
        return { ...p, imageUrl: await ctx.storage.getUrl(p.imageStorageId) ?? p.imageUrl }
      }
      return p
    }))
  },
})

/**
 * Get a single product by ID
 */
export const get = query({
  args: { id: v.id('products') },
  handler: async (ctx, { id }) => {
    const product = await ctx.db.get(id)
    if (!product) return null
    if (product.imageStorageId) {
      return { ...product, imageUrl: await ctx.storage.getUrl(product.imageStorageId) ?? product.imageUrl }
    }
    return product
  },
})

/**
 * Get a product by name
 */
export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const product = await ctx.db
      .query('products')
      .withIndex('by_name', (q) => q.eq('name', name))
      .first()
    
    if (!product) return null
    if (product.imageStorageId) {
      return { ...product, imageUrl: await ctx.storage.getUrl(product.imageStorageId) ?? product.imageUrl }
    }
    return product
  },
})

/**
 * Search products by name using Convex search index
 * Falls back to listing all products when query is empty
 */
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query: searchQuery }) => {
    let products
    if (searchQuery.trim()) {
      products = await ctx.db
        .query('products')
        .withSearchIndex('search_name', (q) => q.search('name', searchQuery))
        .take(50)
    } else {
      products = await ctx.db.query('products').order('desc').take(50)
    }

    return await Promise.all(products.map(async (p) => {
      if (p.imageStorageId) {
        return { ...p, imageUrl: await ctx.storage.getUrl(p.imageStorageId) ?? p.imageUrl }
      }
      return p
    }))
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
    const user = await requireAuth(ctx)

    // Rate limiting
    const { ok, retryAfter } = await rateLimiter.limit(ctx, 'productUpdate', {
      key: user._id,
    })
    if (!ok) {
      throw new Error(
        `Rate limit exceeded. Please try again in ${Math.ceil(retryAfter / 1000)} seconds.`
      )
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
    await requireAdmin(ctx)
    
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
 * Capture price snapshots for all products
 * Called by daily cron job
 * Only stores snapshots when price changes by >= 0.2
 */
export const capturePriceSnapshots = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if price snapshots are enabled
    const enabledSetting = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', 'PRICE_SNAPSHOT_ENABLED'))
      .first()
    
    const isEnabled = enabledSetting?.value !== false
    if (!isEnabled) {
      console.log('Price snapshots are disabled, skipping')
      return
    }

    const products = await ctx.db.query('products').collect()
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    let snapshotCount = 0
    
    for (const product of products) {
      if (product.avgPrice === undefined) continue
      
      // Get last snapshot
      const lastSnapshot = await ctx.db
        .query('priceHistory')
        .withIndex('by_product_and_date', (q) => q.eq('productId', product._id))
        .order('desc')
        .first()
      
      // Only store if price changed by >= 0.2 or first snapshot
      const shouldSnapshot = !lastSnapshot || 
        Math.abs(product.avgPrice - lastSnapshot.price) >= 0.2
      
      if (shouldSnapshot) {
        await ctx.db.insert('priceHistory', {
          productId: product._id,
          price: product.avgPrice,
          snapshotDate: today,
          createdAt: Date.now(),
        })
        snapshotCount++
      }
    }
    
    console.log(`Captured ${snapshotCount} price snapshots out of ${products.length} products`)
  },
})

/**
 * Get price history for a product
 */
export const getPriceHistory = query({
  args: { 
    productId: v.id('products'),
    days: v.optional(v.number()), // Default 90 days
  },
  handler: async (ctx, args) => {
    const days = args.days || 90
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0]
    
    return await ctx.db
      .query('priceHistory')
      .withIndex('by_product', (q) => q.eq('productId', args.productId))
      .filter((q) => q.gte(q.field('snapshotDate'), cutoffDateStr))
      .order('desc')
      .collect()
  },
})
