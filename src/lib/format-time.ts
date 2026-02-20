/**
 * Format a timestamp to a relative time string using i18n keys.
 * Uses: community.justNow, community.minutesAgo, community.hoursAgo,
 *       community.daysAgo, community.weeksAgo, community.monthsAgo, community.yearsAgo
 */
export function formatRelativeTimeI18n(
  timestamp: number,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (years > 0) return t('community.yearsAgo', { count: years })
  if (months > 0) return t('community.monthsAgo', { count: months })
  if (weeks > 0) return t('community.weeksAgo', { count: weeks })
  if (days > 0) return t('community.daysAgo', { count: days })
  if (hours > 0) return t('community.hoursAgo', { count: hours })
  if (minutes > 0) return t('community.minutesAgo', { count: minutes })
  return t('community.justNow')
}
