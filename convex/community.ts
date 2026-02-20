import { publicQuery } from './lib/customFunctions'
import { getAuthUser } from './lib/authHelpers'
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
  },
  handler: async (ctx, { limit, followingOnly }) => {
    const pageSize = Math.min(limit ?? 30, 50)

    // Derive currentUserId from auth context (not client arg)
    const authUser = await getAuthUser(ctx)
    const currentUserId = authUser?._id

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

    // Filter by following set if needed
    const filteredVotes = followingSet
      ? votes.filter((v) => v.userId && followingSet!.has(v.userId))
      : votes

    // Batch-fetch unique products for votes to avoid N+1
    const voteProductIds = [...new Set(filteredVotes.map((v) => v.productId))]
    const voteProductMap = new Map<string, { name: string; imageUrl?: string }>()
    for (const pid of voteProductIds) {
      const product = await ctx.db.get(pid)
      if (product) voteProductMap.set(pid as string, { name: product.name, imageUrl: product.imageUrl })
    }

    for (const vote of filteredVotes) {
      if (!vote.userId) continue
      const product = voteProductMap.get(vote.productId as string)
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

    // Filter by following set if needed
    const filteredComments = followingSet
      ? comments.filter((c) => followingSet!.has(c.userId))
      : comments

    // Batch-fetch unique products for comments to avoid N+1
    const commentProductIds = [...new Set(filteredComments.map((c) => c.productId))]
    const commentProductMap = new Map<string, { name: string; imageUrl?: string }>()
    for (const pid of commentProductIds) {
      // Reuse from vote map if already fetched
      if (voteProductMap.has(pid as string)) {
        commentProductMap.set(pid as string, voteProductMap.get(pid as string)!)
      } else {
        const product = await ctx.db.get(pid)
        if (product) commentProductMap.set(pid as string, { name: product.name, imageUrl: product.imageUrl })
      }
    }

    for (const comment of filteredComments) {
      const product = commentProductMap.get(comment.productId as string)
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
