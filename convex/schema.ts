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
    imageStorageId: v.optional(v.id('_storage')),
    backImageUrl: v.optional(v.string()), // Back of package image
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
    // Extended fields from g-convex
    currency: v.optional(v.string()), // e.g., "HUF", "EUR"
    purchaseLocation: v.optional(v.string()),
    stores: v.optional(v.array(v.object({
      name: v.string(),
      lastSeenAt: v.number(),
      price: v.optional(v.number()),
      geoPoint: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    }))),
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
    // Extended gamification fields from g-convex
    gpsVotes: v.optional(v.number()), // Votes with GPS location
    newProductVotes: v.optional(v.number()), // First votes on new products
    storesTagged: v.optional(v.array(v.string())), // Unique stores tagged
    longestStreak: v.optional(v.number()), // Best streak ever
    votesToday: v.optional(v.number()), // Daily vote counter
    role: v.optional(v.string()), // "admin" | "user"
  }).index('by_user', ['userId']),
})
