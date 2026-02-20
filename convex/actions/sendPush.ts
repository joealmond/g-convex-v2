"use node";
import { publicAction, internalAction } from '../lib/customFunctions'
/**
 * Push Notification Delivery via OneSignal REST API
 *
 * Sends push notifications using OneSignal's Create Notification endpoint.
 * Targets users by `external_id` alias (set client-side via OneSignal.login()).
 * No manual token management — OneSignal handles device registration internally.
 *
 * ⚠️  SETUP REQUIRED: These Convex environment variables must be set:
 * - ONESIGNAL_APP_ID: Your OneSignal App ID (from OneSignal dashboard → Settings → Keys & IDs)
 * - ONESIGNAL_REST_API_KEY: Your OneSignal REST API Key (from the same page)
 *
 * @see https://documentation.onesignal.com/reference/create-notification
 * @see docs/PUSH_NOTIFICATIONS_SETUP.md for full configuration instructions.
 */

import { internal } from '../_generated/api'
import { v } from 'convex/values'
import { retrier } from '../retrier'

const ONESIGNAL_API_URL = 'https://api.onesignal.com/notifications'

/**
 * Send a push notification to a specific user via OneSignal.
 * Targets the user by their external_id (Better Auth user._id).
 *
 * @param userId - The user's Better Auth ID (used as OneSignal external_id)
 * @param title - Notification title (shown in notification shade)
 * @param body - Notification body text
 * @param data - Optional custom data payload (delivered to app on tap)
 */
export const sendPushToUser = publicAction({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Dispatch to the retrier component in the background unconditionally.
    await retrier.run(ctx, internal.actions.sendPush.sendPushToUserInternal, args);
    return { success: true };
  },
})

export const sendPushToUserInternal = internalAction({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (_ctx, { userId, title, body, data }) => {
    const appId = process.env.ONESIGNAL_APP_ID
    const apiKey = process.env.ONESIGNAL_REST_API_KEY

    if (!appId || !apiKey) {
      console.warn('[Push] ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY not set, skipping')
      return { success: false, reason: 'OneSignal not configured' }
    }

    try {
      const response = await fetch(ONESIGNAL_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: appId,
          // Target specific user by external_id (set via OneSignal.login() on client)
          include_aliases: { external_id: [userId] },
          target_channel: 'push',
          // Notification content
          headings: { en: title },
          contents: { en: body },
          // Custom data payload (accessible in notification click handler)
          ...(data && { data }),
          // iOS specifics
          ios_sound: 'default',
          // Android specifics
          android_channel_id: undefined, // Uses default channel
          priority: 10, // High priority
        }),
      })

      const result = await response.json()

      if (response.ok && result.id) {
        console.log(`[Push] Sent to user ${userId.substring(0, 8)}...: notification ${result.id}`)
        return { success: true, sent: 1, failed: 0, notificationId: result.id }
      } else {
        // OneSignal returns errors in result.errors array
        console.error('[Push] OneSignal error:', JSON.stringify(result.errors || result))
        // Throw so the action retrier picks it up and retries over time.
        throw new Error(`OneSignal error: ${JSON.stringify(result.errors || result)}`);
      }
    } catch (error) {
      console.error('[Push] Send failed:', error)
      throw error;
    }
  },
})

/**
 * Send a push notification to multiple users (batch).
 *
 * For small batches (≤10 users), sends a single OneSignal request
 * targeting all external_ids at once. For larger batches, splits into
 * chunks to stay within OneSignal's per-request limits.
 *
 * @param userIds - Array of user IDs
 * @param title - Notification title
 * @param body - Notification body text
 * @param data - Optional data payload
 */
export const sendPushToUsers = publicAction({
  args: {
    userIds: v.array(v.string()),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Schedule via retrier
    await retrier.run(ctx, internal.actions.sendPush.sendPushToUsersInternal, args);
    return { success: true };
  }
})

export const sendPushToUsersInternal = internalAction({
  args: {
    userIds: v.array(v.string()),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (_ctx, { userIds, title, body, data }) => {
    if (userIds.length === 0) {
      return { success: false, sent: 0, failed: 0, userCount: 0 }
    }

    const appId = process.env.ONESIGNAL_APP_ID
    const apiKey = process.env.ONESIGNAL_REST_API_KEY

    if (!appId || !apiKey) {
      console.warn('[Push] ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY not set, skipping')
      return { success: false, sent: 0, failed: 0, userCount: userIds.length, reason: 'OneSignal not configured' }
    }

    // OneSignal supports up to 2000 aliases per request, but we chunk at 50
    // for reasonable response times within Convex action limits.
    const CHUNK_SIZE = 50
    let totalSent = 0
    let totalFailed = 0

    for (let i = 0; i < userIds.length; i += CHUNK_SIZE) {
      const chunk = userIds.slice(i, i + CHUNK_SIZE)

      try {
        const response = await fetch(ONESIGNAL_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Key ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            app_id: appId,
            include_aliases: { external_id: chunk },
            target_channel: 'push',
            headings: { en: title },
            contents: { en: body },
            ...(data && { data }),
            ios_sound: 'default',
            priority: 10,
          }),
        })

        const result = await response.json()

        if (response.ok && result.id) {
          // OneSignal returns recipients count for successful batch
          totalSent += result.recipients || chunk.length
          console.log(`[Push] Batch sent: ${chunk.length} users, notification ${result.id}`)
        } else {
          totalFailed += chunk.length
          console.error('[Push] Batch error:', JSON.stringify(result.errors || result))
          throw new Error(`OneSignal batch error: ${JSON.stringify(result.errors || result)}`)
        }
      } catch (error) {
        totalFailed += chunk.length
        console.error('[Push] Batch send failed:', error)
        throw error;
      }
    }

    return {
      success: totalSent > 0,
      sent: totalSent,
      failed: totalFailed,
      userCount: userIds.length,
    }
  },
})
