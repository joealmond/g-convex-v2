"use node";
import { internalAction } from '../lib/customFunctions'
/**
 * Streak Reminders
 *
 * Checks for users whose voting streak is about to expire and sends push notifications.
 * A streak expires if the user doesn't vote within 24 hours of their last vote.
 */

import { internal } from '../_generated/api'

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
  handler: async (ctx): Promise<{ sent: number; failed?: number; total?: number }> => {
    // Get all profiles with active streaks (3+ days)
    const profiles = await ctx.runQuery(internal.profiles.getActiveStreakers)

    if (profiles.length === 0) {
      console.log('[Streak Reminder] No active streakers found')
      return { sent: 0 }
    }

    const now = Date.now()
    const yesterdayStr = new Date(now - 86_400_000).toISOString().split('T')[0]!

    const usersToRemind: string[] = []

    for (const profile of profiles) {
      if (!profile.lastVoteDate) continue

      // Remind users whose last vote was yesterday (haven't voted today yet).
      // The cron runs at 20:00 UTC — gives an evening nudge before midnight.
      if (profile.lastVoteDate === yesterdayStr) {
        usersToRemind.push(profile.userId)
      }
      // Don't remind if they already voted today (lastVoteDate === todayStr)
      // Don't remind if they missed more than 1 day — streak already broke
    }

    if (usersToRemind.length === 0) {
      console.log('[Streak Reminder] No users need reminders')
      return { sent: 0 }
    }

    // Send push notifications
    console.log(`[Streak Reminder] Sending to ${usersToRemind.length} users`)

    await ctx.runAction(internal.actions.sendPush.sendPushToUsers, {
      userIds: usersToRemind,
      title: '🔥 Your streak is about to expire!',
      body: "Don't lose your streak! Vote today to keep it alive.",
      data: { type: 'streak_reminder' },
    })

    console.log(`[Streak Reminder] Scheduled ${usersToRemind.length} notifications via retrier`)

    return {
      sent: usersToRemind.length,
      failed: 0,
      total: usersToRemind.length,
    }
  },
})
