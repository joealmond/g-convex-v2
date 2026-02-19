/**
 * Streak Reminders
 *
 * Checks for users whose voting streak is about to expire and sends push notifications.
 * A streak expires if the user doesn't vote within 24 hours of their last vote.
 */
import { internalAction } from '../_generated/server'
import { api, internal } from '../_generated/api'

/**
 * Check for streaks about to expire and send reminders.
 * Runs daily at 8 PM UTC to catch users before their 24h window closes.
 *
 * Logic:
 * - Fetch all profiles with streak >= 3 (only remind active streakers)
 * - Filter to those where lastVoteDate was 23 hours ago (1 hour grace period)
 * - Send push notification: "Don't lose your streak! Vote today to keep it alive."
 */
export const checkStreakExpiry = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all profiles with active streaks (3+ days)
    const profiles = await ctx.runQuery(internal.profiles.getActiveStreakers)

    if (profiles.length === 0) {
      console.log('[Streak Reminder] No active streakers found')
      return { sent: 0 }
    }

    const now = Date.now()
    const twentyThreeHoursAgo = now - 23 * 60 * 60 * 1000

    const usersToRemind: string[] = []

    for (const profile of profiles) {
      if (!profile.lastVoteDate) continue

      // Parse lastVoteDate (YYYY-MM-DD format) as UTC midnight
      const lastVoteTime = new Date(profile.lastVoteDate + 'T00:00:00Z').getTime()

      // If last vote was ~23 hours ago (between 22-24h ago), send reminder
      const hoursSinceVote = (now - lastVoteTime) / (1000 * 60 * 60)
      if (hoursSinceVote >= 22 && hoursSinceVote <= 24) {
        usersToRemind.push(profile.userId)
      }
    }

    if (usersToRemind.length === 0) {
      console.log('[Streak Reminder] No users need reminders')
      return { sent: 0 }
    }

    // Send push notifications
    console.log(`[Streak Reminder] Sending to ${usersToRemind.length} users`)

    const result = await ctx.runAction(api.actions.sendPush.sendPushToUsers, {
      userIds: usersToRemind,
      title: '🔥 Your streak is about to expire!',
      body: "Don't lose your streak! Vote today to keep it alive.",
      data: { type: 'streak_reminder' },
    })

    console.log(`[Streak Reminder] Sent ${result.sent} notifications, ${result.failed} failed`)

    return {
      sent: result.sent,
      failed: result.failed,
      total: usersToRemind.length,
    }
  },
})
