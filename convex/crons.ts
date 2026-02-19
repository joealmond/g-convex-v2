/**
 * Convex Cron Jobs
 * 
 * Scheduled functions for:
 * 1. Time-decay: Daily recalculation of product averages with time-weighted votes
 * 2. Price snapshots: Daily capture of price changes
 * 3. Challenge reset: Weekly generation of new community challenges
 * 4. Streak reminders: Daily check for streaks about to expire
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Apply time-decay to all product vote averages
 * Runs daily at midnight UTC (configurable via settings)
 * Older votes have less weight using exponential decay formula
 */
crons.daily(
  "apply-time-decay",
  { hourUTC: 0, minuteUTC: 0 }, // Midnight UTC
  internal.votes.recalculateAllProducts,
);

/**
 * Capture daily price snapshots for products with price changes
 * Runs at 2 AM UTC to avoid collision with time-decay
 * Only stores snapshots when price changes by >= 0.2
 */
crons.daily(
  "capture-price-snapshots",
  { hourUTC: 2, minuteUTC: 0 },
  internal.products.capturePriceSnapshots,
);

/**
 * Reset weekly challenges and generate new ones
 * Runs every Monday at midnight UTC
 * Completes old challenges, generates new auto-templates
 */
crons.weekly(
  "reset-weekly-challenges",
  { dayOfWeek: "monday", hourUTC: 0, minuteUTC: 0 },
  internal.challenges.resetWeeklyChallenges,
);

/**
 * Check for streaks about to expire and send reminders
 * Runs daily at 8 PM UTC (evening reminder for users to vote before midnight)
 * Sends push notifications to users with 3+ day streaks who haven't voted today
 */
crons.daily(
  "check-streak-expiry",
  { hourUTC: 20, minuteUTC: 0 },
  internal.actions.streakReminder.checkStreakExpiry,
);

export default crons;
