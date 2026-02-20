/**
 * Format a distance in km to a human-readable i18n string.
 * Uses translation keys: common.veryClose, common.mAway, common.kmAway
 */
export function formatDistance(
  distanceKm: number,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (distanceKm < 0.1) return t('common.veryClose')
  if (distanceKm < 1) return t('common.mAway', { distance: (distanceKm * 1000).toFixed(0) })
  return t('common.kmAway', { distance: distanceKm.toFixed(1) })
}
