import { publicQuery, authMutation } from './lib/customFunctions'
/**
 * Comments — product reviews/discussions
 *
 * Users can post text comments on products, reply to others,
 * and like/unlike comments. Supports threaded replies (1 level deep).
 */
import { v } from 'convex/values'
import { requireAdmin } from './lib/authHelpers'
import { components } from './_generated/api'
import { RateLimiter } from '@convex-dev/rate-limiter'

const rateLimiter = new RateLimiter(components.rateLimiter, {
  commentPost: { kind: 'token bucket', rate: 10, period: 60000, capacity: 15 },
})

const MAX_COMMENT_LENGTH = 500
const MAX_COMMENTS_PER_PAGE = 30

/**
 * Post a new comment (or reply) on a product.
 */
export const post = authMutation({
  args: {
    productId: v.id('products'),
    text: v.string(),
    parentId: v.optional(v.id('comments')),
  },
  handler: async (ctx, { productId, text, parentId }) => {
    const userId = ctx.userId

    // Rate limiting
    const { ok, retryAfter } = await rateLimiter.limit(ctx, 'commentPost', {
      key: userId,
    })
    if (!ok) {
      throw new Error(
        `Rate limit exceeded. Please try again in ${Math.ceil(retryAfter / 1000)} seconds.`
      )
    }

    const trimmed = text.trim()
    if (!trimmed) throw new Error('Comment cannot be empty')
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      throw new Error(`Comment too long (max ${MAX_COMMENT_LENGTH} chars)`)
    }

    // Verify product exists
    const product = await ctx.db.get(productId)
    if (!product) throw new Error('Product not found')

    // If replying, verify parent exists
    if (parentId) {
      const parent = await ctx.db.get(parentId)
      if (!parent || parent.isDeleted) throw new Error('Parent comment not found')
    }

    return await ctx.db.insert('comments', {
      productId,
      userId,
      text: trimmed,
      parentId,
      likesCount: 0,
      createdAt: Date.now(),
      isEdited: false,
      isDeleted: false,
    })
  },
})

/**
 * Edit an existing comment (only by original author).
 */
export const edit = authMutation({
  args: {
    commentId: v.id('comments'),
    text: v.string(),
  },
  handler: async (ctx, { commentId, text }) => {
    const userId = ctx.userId
    const comment = await ctx.db.get(commentId)
    if (!comment || comment.isDeleted) throw new Error('Comment not found')
    if (comment.userId !== userId) throw new Error('Not authorized')

    const trimmed = text.trim()
    if (!trimmed) throw new Error('Comment cannot be empty')
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      throw new Error(`Comment too long (max ${MAX_COMMENT_LENGTH} chars)`)
    }

    await ctx.db.patch(commentId, {
      text: trimmed,
      updatedAt: Date.now(),
      isEdited: true,
    })
  },
})

/**
 * Soft-delete a comment (by author or admin).
 */
export const remove = authMutation({
  args: {
    commentId: v.id('comments'),
  },
  handler: async (ctx, { commentId }) => {
    const userId = ctx.userId
    const comment = await ctx.db.get(commentId)
    if (!comment) throw new Error('Comment not found')
    // Check if user is owner or admin
    let isAdmin = false
    try { await requireAdmin(ctx); isAdmin = true } catch { /* not admin */ }
    if (comment.userId !== userId && !isAdmin) throw new Error('Not authorized')

    await ctx.db.patch(commentId, {
      isDeleted: true,
      text: '[deleted]',
      updatedAt: Date.now(),
    })
  },
})

/**
 * Toggle like/unlike on a comment.
 */
export const toggleLike = authMutation({
  args: {
    commentId: v.id('comments'),
  },
  handler: async (ctx, { commentId }) => {
    const userId = ctx.userId
    const comment = await ctx.db.get(commentId)
    if (!comment || comment.isDeleted) throw new Error('Comment not found')

    // Check for existing like
    const existing = await ctx.db
      .query('commentLikes')
      .withIndex('by_user_comment', (q) => q.eq('userId', userId).eq('commentId', commentId))
      .first()

    if (existing) {
      // Unlike
      await ctx.db.delete(existing._id)
      await ctx.db.patch(commentId, {
        likesCount: Math.max(0, comment.likesCount - 1),
      })
      return { liked: false }
    } else {
      // Like
      await ctx.db.insert('commentLikes', {
        commentId,
        userId,
        createdAt: Date.now(),
      })
      await ctx.db.patch(commentId, {
        likesCount: comment.likesCount + 1,
      })
      return { liked: true }
    }
  },
})

/**
 * Get comments for a product (newest first), with user like status.
 */
export const getByProduct = publicQuery({
  args: {
    productId: v.id('products'),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, { productId, userId }) => {
    const comments = await ctx.db
      .query('comments')
      .withIndex('by_product', (q) => q.eq('productId', productId))
      .order('desc')
      .take(MAX_COMMENTS_PER_PAGE)

    // Batch fetch user like status
    const commentIds = comments.map((c) => c._id)
    const userLikes = userId
      ? await Promise.all(
          commentIds.map(async (cid) => {
            const like = await ctx.db
              .query('commentLikes')
              .withIndex('by_user_comment', (q) => q.eq('userId', userId).eq('commentId', cid))
              .first()
            return { commentId: cid, liked: !!like }
          })
        )
      : []

    const likeMap = new Map(userLikes.map((l) => [l.commentId, l.liked]))

    return comments.map((c) => ({
      ...c,
      liked: likeMap.get(c._id) ?? false,
    }))
  },
})

/**
 * Get recent comments across all products (for the community feed).
 * Joins product name for display.
 */
export const getRecentFeed = publicQuery({
  args: {
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit }) => {
    const pageSize = Math.min(limit ?? 30, 50)

    // Get recent comments
    const comments = await ctx.db
      .query('comments')
      .order('desc')
      .filter((q) => q.eq(q.field('isDeleted'), false))
      .take(pageSize)

    // Batch lookup products + user like status
    const results = await Promise.all(
      comments.map(async (c) => {
        const product = await ctx.db.get(c.productId)
        const liked = userId
          ? !!(await ctx.db
              .query('commentLikes')
              .withIndex('by_user_comment', (q) => q.eq('userId', userId).eq('commentId', c._id))
              .first())
          : false

        return {
          ...c,
          liked,
          productName: product?.name ?? '[deleted]',
          productImageUrl: product?.imageUrl,
        }
      })
    )

    return results
  },
})
