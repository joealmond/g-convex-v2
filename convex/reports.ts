import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { components } from './_generated/api'
import { RateLimiter } from '@convex-dev/rate-limiter'
import { getAuthUser, requireAdmin } from './lib/authHelpers'

const rateLimiter = new RateLimiter(components.rateLimiter, {
  report: { kind: 'token bucket', rate: 5, period: 3600000, capacity: 10 },
})

// Create a new report
export const create = mutation({
  args: {
    productId: v.id('products'),
    reason: v.union(
      v.literal('inappropriate'),
      v.literal('duplicate'),
      v.literal('wrong-info'),
      v.literal('spam'),
      v.literal('other')
    ),
    details: v.optional(v.string()),
    anonymousId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const userId = user?._id
    const isAnonymous = !userId

    // Rate limiting
    const rateLimitKey = userId || args.anonymousId || 'unknown'
    const { ok, retryAfter } = await rateLimiter.limit(ctx, 'report', {
      key: rateLimitKey,
    })
    if (!ok) {
      throw new Error(
        `Rate limit exceeded. Please try again in ${Math.ceil(retryAfter / 1000)} seconds.`
      )
    }

    // Check if product exists
    const product = await ctx.db.get(args.productId)
    if (!product) {
      throw new Error('Product not found')
    }

    // Check for duplicate reports from same user/anonymous within 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    const reporterId = userId || args.anonymousId
    
    if (reporterId) {
      const recentReports = await ctx.db
        .query('reports')
        .withIndex('by_product', (q) => q.eq('productId', args.productId))
        .filter((q) => 
          q.and(
            q.eq(q.field('reportedBy'), reporterId),
            q.gt(q.field('createdAt'), oneDayAgo)
          )
        )
        .first()

      if (recentReports) {
        throw new Error('You have already reported this product recently')
      }
    }

    // Create report
    const reportId = await ctx.db.insert('reports', {
      productId: args.productId,
      reportedBy: reporterId,
      isAnonymous,
      reason: args.reason,
      details: args.details,
      status: 'pending',
      createdAt: Date.now(),
    })

    return reportId
  },
})

// List all reports (admin only)
export const list = query({
  args: {
    status: v.optional(v.union(
      v.literal('pending'),
      v.literal('reviewed'),
      v.literal('resolved'),
      v.literal('dismissed')
    )),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    await requireAdmin(ctx)

    // Query reports
    let reports
    
    if (args.status) {
      reports = await ctx.db
        .query('reports')
        .withIndex('by_status', (q) => q.eq('status', args.status!))
        .order('desc')
        .take(100)
    } else {
      reports = await ctx.db
        .query('reports')
        .order('desc')
        .take(100)
    }

    // Enrich with product data only (user data lives in auth component)
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const product = report.productId
          ? await ctx.db.get(report.productId)
          : null

        return {
          ...report,
          product: product
            ? { _id: product._id, name: product.name }
            : null,
          reporter: report.isAnonymous
            ? null
            : { id: report.reportedBy },
          reviewer: report.reviewedBy
            ? { id: report.reviewedBy }
            : null,
        }
      })
    )

    return enrichedReports
  },
})

// Update report status (admin only)
export const updateStatus = mutation({
  args: {
    reportId: v.id('reports'),
    status: v.union(
      v.literal('pending'),
      v.literal('reviewed'),
      v.literal('resolved'),
      v.literal('dismissed')
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx)

    // Update report
    await ctx.db.patch(args.reportId, {
      status: args.status,
      reviewedBy: user._id,
      reviewedAt: Date.now(),
    })
  },
})

// Get reports for a specific product (admin only)
export const getByProduct = query({
  args: {
    productId: v.id('products'),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const reports = await ctx.db
      .query('reports')
      .withIndex('by_product', (q) => q.eq('productId', args.productId))
      .collect()

    return reports
  },
})

// Get report count for a product (public)
// Optimized: uses take() with a cap instead of collect()
export const getReportCount = query({
  args: {
    productId: v.id('products'),
  },
  handler: async (ctx, args) => {
    const MAX_COUNT = 1000
    const reports = await ctx.db
      .query('reports')
      .withIndex('by_product', (q) => q.eq('productId', args.productId))
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .take(MAX_COUNT)

    return reports.length
  },
})
