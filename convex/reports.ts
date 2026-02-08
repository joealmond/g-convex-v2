import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getAuthUser, requireAdmin } from './lib/authHelpers'

// Create a new report
export const create = mutation({
  args: {
    productId: v.id('products'),
    reason: v.string(),
    details: v.optional(v.string()),
    anonymousId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const userId = user?._id
    const isAnonymous = !userId

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
    status: v.optional(v.string()),
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
    status: v.string(),
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
export const getReportCount = query({
  args: {
    productId: v.id('products'),
  },
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query('reports')
      .withIndex('by_product', (q) => q.eq('productId', args.productId))
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .collect()

    return reports.length
  },
})
