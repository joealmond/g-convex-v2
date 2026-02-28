import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({

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
    // Barcode & product identification
    barcode: v.optional(v.string()),          // UPC/EAN barcode
    barcodeSource: v.optional(v.string()),     // 'openfoodfacts' | 'manual' | 'ai'
    category: v.optional(v.string()),          // e.g., 'snack', 'bread', 'pasta'
    brand: v.optional(v.string()),             // manufacturer brand name
    description: v.optional(v.string()),       // product description
    // Nutrition & allergens
    nutritionScore: v.optional(v.string()),    // Nutri-Score: 'a'|'b'|'c'|'d'|'e'
    allergens: v.optional(v.array(v.string())),// ['gluten', 'milk', 'soy']
    servingSize: v.optional(v.string()),       // e.g., '100g', '1 bar (40g)'
    // Images
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id('_storage')),
    backImageUrl: v.optional(v.string()), // Back of package image
    // Ingredients & ratings
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
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
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
    .index('by_barcode', ['barcode'])
    .index('by_created', ['createdAt'])
    .index('by_creator', ['createdBy'])
    .index('by_vote_count', ['voteCount'])
    .searchIndex('search_name', {
      searchField: 'name',
    }),

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
    .index('by_product_user', ['productId', 'userId'])
    .index('by_product_anonymous', ['productId', 'anonymousId'])
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
    role: v.optional(v.union(v.literal('admin'), v.literal('user'))),
  }).index('by_user', ['userId'])
    .index('by_points', ['points'])
    .index('by_streak', ['streak']),

  // Reports - flag products for review
  reports: defineTable({
    productId: v.id('products'),
    reportedBy: v.optional(v.string()), // userId or anonymousId
    isAnonymous: v.boolean(),
    reason: v.union(
      v.literal('inappropriate'),
      v.literal('duplicate'),
      v.literal('wrong-info'),
      v.literal('spam'),
      v.literal('other')
    ),
    details: v.optional(v.string()),
    status: v.union(
      v.literal('pending'),
      v.literal('reviewed'),
      v.literal('resolved'),
      v.literal('dismissed')
    ),
    reviewedBy: v.optional(v.string()), // Admin userId
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_product', ['productId'])
    .index('by_status', ['status'])
    .index('by_product_status', ['productId', 'status'])
    .index('by_reporter', ['reportedBy']),

  // Follows - user following relationships
  follows: defineTable({
    followerId: v.string(), // Better Auth user._id is a string
    followingId: v.string(), // Better Auth user._id is a string
    createdAt: v.number(),
  })
    .index('by_follower', ['followerId'])
    .index('by_following', ['followingId'])
    .index('by_relationship', ['followerId', 'followingId']),

  // Dietary Profiles - boolean allergen avoidance
  dietaryProfiles: defineTable({
    userId: v.string(), // Better Auth user._id is a string
    avoidedAllergens: v.optional(v.array(v.string())), // e.g. ['gluten', 'milk', 'nuts']
    // Legacy field kept for migration — old docs have conditions instead of avoidedAllergens
    conditions: v.optional(v.array(v.object({
      type: v.string(),
      severity: v.number(),
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

  // Price History - time-series price tracking
  priceHistory: defineTable({
    productId: v.id('products'),
    storeId: v.optional(v.string()),
    storeName: v.optional(v.string()),
    price: v.number(), // 1-5 scale
    snapshotDate: v.string(), // YYYY-MM-DD format
    createdAt: v.number(),
  })
    .index('by_product', ['productId'])
    .index('by_product_and_date', ['productId', 'snapshotDate']),

  // Challenges - weekly/monthly community goals
  challenges: defineTable({
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal('vote'),
      v.literal('product'),
      v.literal('streak'),
      v.literal('store')
    ),
    targetValue: v.number(), // e.g., 10 votes, 2 products, 7 days streak
    rewardPoints: v.number(),
    rewardBadge: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    isActive: v.boolean(),
    isTemplate: v.boolean(), // Auto-generated vs admin-created
    createdBy: v.optional(v.string()), // Admin userId if manually created
    createdAt: v.number(),
  })
    .index('by_active', ['isActive'])
    .index('by_date_range', ['startDate', 'endDate']),

  // User Challenges - progress tracking for each user on each challenge
  userChallenges: defineTable({
    userId: v.string(), // Better Auth user._id is a string
    challengeId: v.id('challenges'),
    progress: v.number(), // Current progress (e.g., 5 out of 10 votes)
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    rewardClaimed: v.boolean(), // Prevent double-claiming
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_challenge', ['challengeId'])
    .index('by_user_and_challenge', ['userId', 'challengeId']),

  // Settings - admin configuration for time-decay, crons, etc.
  settings: defineTable({
    key: v.string(), // "TIME_DECAY_ENABLED", "DECAY_RATE", "DECAY_HOUR", etc.
    value: v.union(v.string(), v.number(), v.boolean()),
    updatedBy: v.optional(v.string()), // Admin userId
    updatedAt: v.number(),
  }).index('by_key', ['key']),

  // Device tokens - DEPRECATED (OneSignal manages tokens internally)
  // Kept for backward compatibility — can be removed in a future schema migration
  deviceTokens: defineTable({
    userId: v.string(),
    token: v.string(),
    platform: v.union(v.literal('ios'), v.literal('android'), v.literal('web')),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
  }).index('by_user', ['userId'])
    .index('by_token', ['token']),

  // Comments - product reviews/discussions
  comments: defineTable({
    productId: v.id('products'),
    userId: v.string(),           // Better Auth user._id
    text: v.string(),              // Comment text (max ~500 chars enforced in mutation)
    parentId: v.optional(v.id('comments')), // For threaded replies
    likesCount: v.number(),        // Denormalized like count
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    isEdited: v.boolean(),
    isDeleted: v.boolean(),        // Soft delete
  })
    .index('by_product', ['productId'])
    .index('by_user', ['userId'])
    .index('by_product_created', ['productId', 'createdAt']),

  // Comment likes - prevent double-liking
  commentLikes: defineTable({
    commentId: v.id('comments'),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index('by_comment', ['commentId'])
    .index('by_user_comment', ['userId', 'commentId']),
})
