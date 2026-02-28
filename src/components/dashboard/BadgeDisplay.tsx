import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BADGES } from '@convex/lib/gamification'
import { useTranslation } from '@/hooks/use-translation'

interface BadgeDisplayProps {
  earnedBadgeIds: string[]
  compact?: boolean
  showLocked?: boolean
  /** Hide the Card wrapper and header (when embedded in a CollapsibleSection) */
  hideHeader?: boolean
}

/**
 * Display badges earned by a user
 * Shows earned badges prominently and locked badges grayed out
 */
export function BadgeDisplay({
  earnedBadgeIds,
  compact = false,
  showLocked = true,
  hideHeader = false,
}: BadgeDisplayProps) {
  const { t } = useTranslation()
  const earnedBadges = BADGES.filter(badge => earnedBadgeIds.includes(badge.id))
  const lockedBadges = showLocked
    ? BADGES.filter(badge => !earnedBadgeIds.includes(badge.id))
    : []

  if (compact) {
    // Compact view - just show earned badge icons
    return (
      <div className="flex flex-wrap gap-2">
        {earnedBadges.length > 0 ? (
          earnedBadges.map((badge) => (
            <div
              key={badge.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
              title={badge.description}
            >
              <span className="text-lg">{badge.icon}</span>
              <span className="text-sm font-medium">{badge.name}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{t('badge.noBadgesYet')}</p>
        )}
      </div>
    )
  }

  // Full view with grid layout
  const gridContent = (
    <>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Earned Badges First */}
        {earnedBadges.map((badge) => (
          <div
            key={badge.id}
            className="p-4 rounded-lg border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            <div className="text-center">
              <div className="text-4xl mb-2">{badge.icon}</div>
              <div className="font-semibold text-sm mb-1">{badge.name}</div>
              <div className="text-xs text-muted-foreground mb-2">
                {badge.description}
              </div>
              <Badge variant="secondary" className="text-xs">
                {t('badge.earned')}
              </Badge>
            </div>
          </div>
        ))}

        {/* Locked Badges */}
        {showLocked &&
          lockedBadges.map((badge) => (
            <div
              key={badge.id}
              className="p-4 rounded-lg border-2 border-muted bg-muted/30 opacity-50 hover:opacity-70 transition-opacity"
            >
              <div className="text-center">
                <div className="text-4xl mb-2 grayscale">{badge.icon}</div>
                <div className="font-semibold text-sm mb-1">{badge.name}</div>
                <div className="text-xs text-muted-foreground mb-2">
                  {badge.description}
                </div>
                <Badge variant="outline" className="text-xs">
                  {t('badge.locked')}
                </Badge>
              </div>
            </div>
          ))}
      </div>

      {earnedBadges.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-4xl mb-3">🏆</p>
          <p>{t('badge.startContributing')}</p>
        </div>
      )}
    </>
  )

  if (hideHeader) {
    return gridContent
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('badge.title')}</CardTitle>
        <CardDescription>
          {t('badge.countDesc', { earned: earnedBadges.length, total: BADGES.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>{gridContent}</CardContent>
    </Card>
  )
}
