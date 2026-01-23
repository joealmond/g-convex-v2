import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // Example messages table for Hello World demo (to be removed in Phase 3)
  messages: defineTable({
    content: v.string(),
    authorId: v.optional(v.string()),
    authorName: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_created', ['createdAt']),

  // File uploads (kept for image uploads)
  files: defineTable({
    storageId: v.id('_storage'),
    name: v.string(),
    type: v.string(),
    size: v.number(),
    uploadedBy: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_uploader', ['uploadedBy']),

  // Products - gluten-free products with ratings
  products: defineTable({
    name: v.string(),
    imageUrl: v.optional(v.string()),
    ingredients: v.optional(v.array(v.string())),
    averageSafety: v.number(), // 0-100
    averageTaste: v.number(), // 0-100
    avgPrice: v.optional(v.number()), // 1-5
    voteCount: v.number(),
    registeredVotes: v.number(),
    anonymousVotes: v.number(),
    lastUpdated: v.number(),
    createdBy: v.optional(v.string()), // Better Auth user._id is a string
    createdAt: v.number(),
  })
    .index('by_name', ['name'])
    .index('by_created', ['createdAt']),

  // Votes - individual user ratings
  votes: defineTable({
    productId: v.id('products'),
    userId: v.optional(v.string()), // Better Auth user._id is a string
    anonymousId: v.optional(v.string()),
    isAnonymous: v.boolean(),
    safety: v.number(), // 0-100
    taste: v.number(), // 0-100
    price: v.optional(v.number()), // 1-5
    storeName: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_product', ['productId'])
    .index('by_user', ['userId'])
    .index('by_anonymous', ['anonymousId']),

  // Profiles - gamification data
  profiles: defineTable({
    userId: v.string(), // Better Auth user._id is a string
    points: v.number(),
    badges: v.array(v.string()),
    streak: v.number(),
    lastVoteDate: v.optional(v.string()), // YYYY-MM-DD format
    totalVotes: v.number(),
  }).index('by_user', ['userId']),
})
