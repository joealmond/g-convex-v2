import { v } from 'convex/values'
import { paginationOptsValidator } from 'convex/server'

import { components } from './_generated/api'
import { productsGeo } from './geospatial'
import { RateLimiter } from '@convex-dev/rate-limiter'
import { filter } from 'convex-helpers/server/filter'
import { authMutation, adminMutation, publicQuery, internalMutation } from './lib/customFunctions'
import { productsAggregate, votesByProduct } from './aggregates'

const rateLimiter = new RateLimiter(components.rateLimiter, {
  productUpdate: { kind: 'token bucket', rate: 10, period: 60000, capacity: 15 },
  productCreate: { kind: 'token bucket', rate: 5, period: 3600000, capacity: 10 },
})

/**
 * Resolve product image URL from Convex storage.
 * If the product has an imageStorageId, fetch the signed URL; otherwise fall back to imageUrl.
 */
async function resolveProductImage<T extends { imageStorageId?: string; imageUrl?: string }>(
  ctx: { storage: { getUrl: (id: string) => Promise<string | null> } },
  product: T,
): Promise<T> {
  if (product.imageStorageId) {
    return { ...product, imageUrl: (await ctx.storage.getUrl(product.imageStorageId)) ?? product.imageUrl }
  }
  return product
}

/**
 * List all products with cursor-based pagination
 * Sorted by most recently created
 */
export const list = publicQuery({
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
      result.page.map((p) => resolveProductImage(ctx, p))
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
export const listAll = publicQuery({
  handler: async (ctx) => {
    const products = await ctx.db.query('products').order('desc').collect()
    return await Promise.all(products.map((p) => resolveProductImage(ctx, p)))
  },
})

/**
 * Get products created by a specific user
 * Uses by_creator index — avoids fetching all products and filtering client-side
 */
export const getByCreator = publicQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const products = await ctx.db
      .query('products')
      .withIndex('by_creator', (q) => q.eq('createdBy', userId))
      .order('desc')
      .collect()
    return await Promise.all(products.map((p) => resolveProductImage(ctx, p)))
  },
})

/**
 * Get products available at a specific store
 * Checks the stores array for matching store name
 */
export const getByStore = publicQuery({
  args: { storeName: v.string() },
  handler: async (ctx, { storeName }) => {
    // No direct index on stores array; we filter at DB level
    const products = await ctx.db
      .query('products')
      .filter((q) => q.neq(q.field('stores'), undefined))
      .collect()

    const matching = products.filter((p) =>
      p.stores?.some((s) => s.name.toLowerCase() === storeName.toLowerCase())
    )

    return await Promise.all(matching.map((p) => resolveProductImage(ctx, p)))
  },
})

/**
 * Get a single product by ID
 */
export const get = publicQuery({
  args: { id: v.id('products') },
  handler: async (ctx, { id }) => {
    const product = await ctx.db.get(id)
    if (!product) return null
    return resolveProductImage(ctx, product)
  },
})

/**
 * Get a product by name
 */
export const getByName = publicQuery({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const product = await ctx.db
      .query('products')
      .withIndex('by_name', (q) => q.eq('name', name))
      .first()
    
    if (!product) return null
    return resolveProductImage(ctx, product)
  },
})

/**
 * Search products by name using Convex search index
 * Falls back to listing all products when query is empty
 */
export const search = publicQuery({
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

    return await Promise.all(products.map((p) => resolveProductImage(ctx, p)))
  },
})

/**
 * Paginated feed query — replaces client-side listAll+filter approach.
 * Supports recent/trending modes with optional server-side allergen exclusion.
 * Uses convex-helpers filter() for array-contains checks on allergens.
 */
export const listFeed = publicQuery({
  args: {
    mode: v.union(v.literal('recent'), v.literal('trending')),
    excludeAllergens: v.optional(v.array(v.string())),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { mode, excludeAllergens } = args

    // Build base query with appropriate index/ordering
    let baseQuery
    if (mode === 'trending') {
      baseQuery = ctx.db
        .query('products')
        .withIndex('by_vote_count')
        .order('desc')
    } else {
      // 'recent' — default _creationTime descending order
      baseQuery = ctx.db
        .query('products')
        .order('desc')
    }

    // If allergen exclusions are active, wrap with convex-helpers filter
    const hasAllergenFilter = excludeAllergens && excludeAllergens.length > 0

    let queryToPage
    if (hasAllergenFilter) {
      queryToPage = filter(
        baseQuery,
        (product) => {
          // Products with no allergens data pass through (not penalized for missing data)
          if (!product.allergens || product.allergens.length === 0) return true
          // Exclude products that contain ANY of the excluded allergens
          return !product.allergens.some((a: string) =>
            excludeAllergens!.includes(a.toLowerCase())
          )
        },
      )
    } else {
      queryToPage = baseQuery
    }

    const result = await queryToPage.paginate(args.paginationOpts)

    const pageWithImages = await Promise.all(
      result.page.map((p) => resolveProductImage(ctx, p))
    )

    return {
      ...result,
      page: pageWithImages,
    }
  },
})

/**
 * Search products by name with pagination and optional allergen exclusion.
 * Uses Convex search index for relevance-ranked results.
 */
export const searchPaginated = publicQuery({
  args: {
    query: v.string(),
    excludeAllergens: v.optional(v.array(v.string())),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { query: searchQuery, excludeAllergens } = args

    let baseQuery
    if (searchQuery.trim()) {
      baseQuery = ctx.db
        .query('products')
        .withSearchIndex('search_name', (q) => q.search('name', searchQuery))
    } else {
      baseQuery = ctx.db.query('products').order('desc')
    }

    const hasAllergenFilter = excludeAllergens && excludeAllergens.length > 0

    let queryToPage
    if (hasAllergenFilter) {
      queryToPage = filter(
        baseQuery,
        (product) => {
          if (!product.allergens || product.allergens.length === 0) return true
          return !product.allergens.some((a: string) =>
            excludeAllergens!.includes(a.toLowerCase())
          )
        },
      )
    } else {
      queryToPage = baseQuery
    }

    const result = await queryToPage.paginate(args.paginationOpts)

    const pageWithImages = await Promise.all(
      result.page.map((p) => resolveProductImage(ctx, p))
    )

    return {
      ...result,
      page: pageWithImages,
    }
  },
})

const MAX_PRODUCT_NAME_LENGTH = 100

/**
 * Create a new product
 */
export const create = authMutation({
  args: {
    name: v.string(),
    imageUrl: v.optional(v.string()),
    ingredients: v.optional(v.array(v.string())),
    initialSafety: v.optional(v.number()),
    initialTaste: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = ctx.userId

    // Input validation
    const trimmedName = args.name.trim()
    if (!trimmedName) {
      throw new Error('Product name cannot be empty')
    }
    if (trimmedName.length > MAX_PRODUCT_NAME_LENGTH) {
      throw new Error(`Product name too long (max ${MAX_PRODUCT_NAME_LENGTH} chars)`)
    }

    // Rate limiting
    const { ok, retryAfter } = await rateLimiter.limit(ctx, 'productCreate', {
      key: userId,
    })
    if (!ok) {
      throw new Error(
        `Rate limit exceeded. Please try again in ${Math.ceil(retryAfter / 1000)} seconds.`
      )
    }
    
    // Check if product already exists
    const existing = await ctx.db
      .query('products')
      .withIndex('by_name', (q) => q.eq('name', trimmedName))
      .first()
    
    if (existing) {
      throw new Error('Product already exists')
    }

    const productId = await ctx.db.insert('products', {
      name: trimmedName,
      imageUrl: args.imageUrl,
      ingredients: args.ingredients,
      averageSafety: args.initialSafety ?? 50,
      averageTaste: args.initialTaste ?? 50,
      avgPrice: undefined,
      voteCount: 0,
      registeredVotes: 0,
      anonymousVotes: 0,
      lastUpdated: Date.now(),
      createdBy: userId,
      createdAt: Date.now(),
      latitude: undefined,
      longitude: undefined,
    })

    const newProduct = await ctx.db.get(productId)
    if (newProduct) await productsAggregate.insert(ctx, newProduct)

    return productId
  },
})

/**
 * Update a product
 */
export const update = authMutation({
  args: {
    id: v.id('products'),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    ingredients: v.optional(v.array(v.string())),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...updates }) => {
    // Rate limiting
    const { ok, retryAfter } = await rateLimiter.limit(ctx, 'productUpdate', {
      key: ctx.userId,
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
    
    // Update geospatial index if coordinates changed
    if (updates.latitude !== undefined || updates.longitude !== undefined) {
      const product = await ctx.db.get(id)
      if (product && product.latitude !== undefined && product.longitude !== undefined) {
        // Geospatial Index insert handles upserts automatically
        // 4th arg is filterKeys, which we aren't using for now, so we pass {}
        await productsGeo.insert(ctx, id, {
          latitude: product.latitude,
          longitude: product.longitude
        }, {})
      }
    }

    return id
  },
})

/**
 * Run an aggregate index operation, swallowing errors when the index is out of sync.
 * DB records are the source of truth; aggregate cleanup is best-effort.
 */
async function safeAggregate(label: string, fn: () => Promise<unknown>) {
  try {
    await fn()
  } catch (e) {
    console.warn(`[deleteProduct] ${label}:`, e)
  }
}

/**
 * Delete a product (admin only)
 */
export const deleteProduct = adminMutation({
  args: { id: v.id('products') },
  handler: async (ctx, { id }) => {
    // Delete all votes for this product
    const votes = await ctx.db
      .query('votes')
      .withIndex('by_product', (q) => q.eq('productId', id))
      .collect()
    
    for (const vote of votes) {
      await ctx.db.delete(vote._id)
      await safeAggregate(`vote ${vote._id}`, () => votesByProduct.delete(ctx, vote))
    }

    const docToDelete = await ctx.db.get(id)
    await ctx.db.delete(id)
    if (docToDelete) {
      await safeAggregate(`product ${id}`, () => productsAggregate.delete(ctx, docToDelete))
      await safeAggregate(`geo ${id}`, () => productsGeo.remove(ctx, id))
    }
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

    const products = await ctx.db
      .query('products')
      .filter((q) => q.neq(q.field('avgPrice'), undefined))
      .collect()
    const today = new Date().toISOString().split('T')[0]! // YYYY-MM-DD
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
export const getPriceHistory = publicQuery({
  args: { 
    productId: v.id('products'),
    days: v.optional(v.number()), // Default 90 days
  },
  handler: async (ctx, args) => {
    const days = args.days || 90
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0]!
    
    return await ctx.db
      .query('priceHistory')
      .withIndex('by_product', (q) => q.eq('productId', args.productId))
      .filter((q) => q.gte(q.field('snapshotDate'), cutoffDateStr))
      .order('desc')
      .collect()
  },
})

/**
 * Get nearby products using the Geospatial Index
 */
export const getNearbyProducts = publicQuery({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radiusInMeters: v.optional(v.number()), // default 10km = 10000m
    limit: v.optional(v.number()), // default 20
  },
  handler: async (ctx, args) => {
    const radius = args.radiusInMeters ?? 10000
    const limitAmount = args.limit ?? 20

    // queryNearest handles the geospatial math and sorting natively!
    const results = await productsGeo.nearest(ctx, {
      point: { 
        latitude: args.latitude,
        longitude: args.longitude,
      },
      maxDistance: radius,
      limit: limitAmount,
    })

    // Wait for all product document reads to complete
    const products = await Promise.all(
      results.map(async (result) => {
        const product = await ctx.db.get(result.key as import('./_generated/dataModel').Id<"products">)
        if (!product) return null
        
        const resolved = await resolveProductImage(ctx, product)

        return {
          ...resolved,
          distance: result.distance // distance in meters is returned by the index
        }
      })
    )

    // filter out nulls in case a product was hard-deleted outside of deleteProduct
    return products.filter((p): p is NonNullable<typeof p> => p !== null)
  },
})
