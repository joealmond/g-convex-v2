"use node";
import { internalAction } from '../lib/customFunctions'
/**
 * New Product Nearby Notifications
 *
 * Sends push notifications to users when a new product is created near their location.
 * Uses vote GPS coordinates to find nearby users.
 */

import { api, internal } from '../_generated/api'
import { v } from 'convex/values'

/**
 * Calculate distance between two GPS coordinates using Haversine formula.
 * Returns distance in kilometers.
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Find users who have voted with GPS location within a radius.
 * Returns unique user IDs (excludes the product creator).
 *
 * @param latitude - Product location latitude
 * @param longitude - Product location longitude
 * @param radiusKm - Search radius in kilometers (default 10km)
 * @param excludeUserId - User ID to exclude (product creator)
 */
export const findNearbyUsers = internalAction({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radiusKm: v.optional(v.number()),
    excludeUserId: v.optional(v.string()),
  },
  handler: async (ctx, { latitude, longitude, radiusKm = 10, excludeUserId }) => {
    // Fetch all votes with GPS coordinates
    const votes = await ctx.runQuery(internal.votes.getVotesWithGPS)

    const nearbyUserIds = new Set<string>()

    for (const vote of votes) {
      if (!vote.latitude || !vote.longitude) continue
      if (vote.userId === excludeUserId) continue // Don't notify the creator

      const distance = calculateDistance(
        latitude,
        longitude,
        vote.latitude,
        vote.longitude
      )

      if (distance <= radiusKm) {
        if (vote.userId) {
          nearbyUserIds.add(vote.userId)
        }
      }
    }

    return Array.from(nearbyUserIds)
  },
})

/**
 * Send "new product near you" notifications.
 * Triggered when a product is created with GPS location.
 *
 * @param productId - The newly created product ID
 * @param productName - Product name for notification
 * @param latitude - Product GPS latitude
 * @param longitude - Product GPS longitude
 * @param createdBy - User ID of product creator (excluded from notifications)
 */
export const notifyNearbyProduct = internalAction({
  args: {
    productId: v.string(),
    productName: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, { productId, productName, latitude, longitude, createdBy }): Promise<{ sent: number; failed?: number; total?: number }> => {
    console.log(`[Nearby Product] Finding users near ${productName} (${latitude}, ${longitude})`)

    // Find users within 10km radius
    const nearbyUserIds = await ctx.runAction(internal.actions.nearbyProduct.findNearbyUsers, {
      latitude,
      longitude,
      radiusKm: 10,
      excludeUserId: createdBy,
    })

    if (nearbyUserIds.length === 0) {
      console.log(`[Nearby Product] No nearby users found for ${productName}`)
      return { sent: 0 }
    }

    console.log(`[Nearby Product] Sending to ${nearbyUserIds.length} nearby users`)

    // Send push notifications
    await ctx.runAction(api.actions.sendPush.sendPushToUsers, {
      userIds: nearbyUserIds,
      title: '📍 New product near you!',
      body: `${productName} was just added nearby. Be the first to rate it!`,
      data: {
        type: 'nearby_product',
        productId,
        productName,
      },
    })

    console.log(`[Nearby Product] Scheduled ${nearbyUserIds.length} notifications via retrier`)

    return {
      sent: nearbyUserIds.length,
      failed: 0,
      total: nearbyUserIds.length,
    }
  },
})
