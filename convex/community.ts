import { publicQuery } from './lib/customFunctions'
/**
 * Community Feed — aggregated activity stream
 *
 * Generates a unified feed of recent community activity:
 * - New product ratings (votes)
 * - New product additions
 * - New comments/reviews
 *
 * No separate "activities" table — we query across existing tables
 * and merge results sorted by timestamp.
 */
import { v } from 'convex/values'


type FeedItem =
  | { type: 'vote'; userId: string; productId: string; productName: string; productImage?: string; safety: number; taste: number; timestamp: number }
  | { type: 'product'; userId: string; productId: string; productName: string; productImage?: string; timestamp: number }
  | { type: 'comment'; userId: string; productId: string; productName: string; productImage?: string; commentText: string; commentId: string; timestamp: number }

/**
 * Get unified community activity feed.
 * Merges recent votes, new products, and comments.
 */
export const getCommunityFeed = publicQuery({
  args: {
    limit: v.optional(v.number()),
    /** Only show activity from users I follow */
    followingOnly: v.optional(v.boolean()),
    currentUserId: v.optional(v.string()),
  },
  handler: async (ctx, { limit, followingOnly, currentUserId }) => {
    const pageSize = Math.min(limit ?? 30, 50)

    // If following-only, get the set of user IDs the current user follows
    let followingSet: Set<string> | null = null
    if (followingOnly && currentUserId) {
      const follows = await ctx.db
        .query('follows')
        .withIndex('by_follower', (q) => q.eq('followerId', currentUserId))
        .collect()
      followingSet = new Set(follows.map((f) => f.followingId))
    }

    const feed: FeedItem[] = []

    // 1. Recent votes (non-anonymous, with userId)
    const votes = await ctx.db
      .query('votes')
      .order('desc')
      .filter((q) => q.neq(q.field('userId'), undefined))
      .take(pageSize * 2)

    for (const vote of votes) {
      if (!vote.userId) continue
      if (followingSet && !followingSet.has(vote.userId)) continue

      const product = await ctx.db.get(vote.productId)
      if (!product) continue

      feed.push({
        type: 'vote',
        userId: vote.userId,
        productId: vote.productId as string,
        productName: product.name,
        productImage: product.imageUrl,
        safety: vote.safety,
        taste: vote.taste,
        timestamp: vote.createdAt,
      })

      if (feed.length >= pageSize) break
    }

    // 2. Recent products (with createdBy)
    const products = await ctx.db
      .query('products')
      .order('desc')
      .filter((q) => q.neq(q.field('createdBy'), undefined))
      .take(pageSize)

    for (const product of products) {
      if (!product.createdBy) continue
      if (followingSet && !followingSet.has(product.createdBy)) continue

      feed.push({
        type: 'product',
        userId: product.createdBy,
        productId: product._id as string,
        productName: product.name,
        productImage: product.imageUrl,
        timestamp: product.createdAt,
      })
    }

    // 3. Recent comments (non-deleted)
    const comments = await ctx.db
      .query('comments')
      .order('desc')
      .filter((q) => q.eq(q.field('isDeleted'), false))
      .take(pageSize)

    for (const comment of comments) {
      if (followingSet && !followingSet.has(comment.userId)) continue

      const product = await ctx.db.get(comment.productId)
      if (!product) continue

      feed.push({
        type: 'comment',
        userId: comment.userId,
        productId: comment.productId as string,
        productName: product.name,
        productImage: product.imageUrl,
        commentText: comment.text.substring(0, 120),
        commentId: comment._id as string,
        timestamp: comment.createdAt,
      })
    }

    // Sort all items by timestamp descending, take page size
    feed.sort((a, b) => b.timestamp - a.timestamp)
    return feed.slice(0, pageSize)
  },
})
