import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Trophy, Flame, Star, Users, TrendingUp, Moon, Sun, Monitor, Settings } from 'lucide-react'
import { getUserLevel } from '@/lib/app-config'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { BadgeDisplay } from '@/components/dashboard/BadgeDisplay'
import { DietaryProfileSettings } from '@/components/dashboard/DietaryProfileSettings'
import { Leaderboard } from '@/components/dashboard/Leaderboard'
import { ProfileSettings } from '@/components/profile/ProfileSettings'
import { ProfileActivityFeed } from '@/components/profile/ProfileActivityFeed'
import { useTranslation } from '@/hooks/use-translation'
import { useGeolocation, useTheme } from '@/hooks'
import { useConvexAuth } from '@convex-dev/react-query'
import { authClient } from '@/lib/auth-client'
import { getNearbyRange, setNearbyRange } from '@/hooks/use-product-filter'


export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

function ProfileLoading() {
  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Header skeleton */}
        <div className="h-10 w-24 bg-muted animate-pulse rounded" />
        
        {/* User card skeleton */}
        <div className="bg-card rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 bg-muted animate-pulse rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-muted animate-pulse rounded w-32" />
              <div className="h-4 bg-muted animate-pulse rounded w-48" />
              <div className="h-6 bg-muted animate-pulse rounded w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-muted animate-pulse rounded" />
            <div className="h-2 bg-muted animate-pulse rounded" />
          </div>
        </div>
        
        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card rounded-2xl p-4">
              <div className="h-8 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
        
        {/* Badges skeleton */}
        <div className="space-y-3">
          <div className="h-6 bg-muted animate-pulse rounded w-24" />
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-card rounded-2xl p-3">
                <div className="h-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * SSR-safe wrapper — hooks are only called inside ProfileContent
 * which is wrapped in a Suspense boundary.
 */
function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileContent />
    </Suspense>
  )
}

function ProfileContent() {
  const { t, locale, setLocale } = useTranslation()
  const navigate = useNavigate()
  const user = useQuery(api.users.current)
  const profile = useQuery(api.profiles.getCurrent)
  const myVotes = useQuery(api.votes.getByUser, user ? { userId: user._id } : 'skip')
  const myProducts = useQuery(api.products.getByCreator, user ? { userId: user._id } : 'skip')
  const followCounts = useQuery(
    api.follows.getCounts,
    user ? { userId: user._id } : 'skip'
  )
  const { coords, loading: geoLoading, requestLocation } = useGeolocation()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { isLoading: isAuthLoading } = useConvexAuth()

  const ThemeIcon = theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun
  const [nearbyRangeKm, setNearbyRangeKm] = useState(5)

  // Sync nearby range from localStorage on mount
  useEffect(() => {
    setNearbyRangeKm(getNearbyRange())
  }, [])
  const themeLabel = theme === 'system' ? t('profile.themeSystem') : theme === 'dark' ? t('profile.themeDark') : t('profile.themeLight')
  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate({ to: '/login' })
  }

  // Redirect to login only when auth has settled and user is definitely null
  useEffect(() => {
    if (!isAuthLoading && user === null) {
      navigate({ to: '/login' })
    }
  }, [user, isAuthLoading, navigate])

  if (isAuthLoading || user === undefined || user === null) {
    return <ProfileLoading />
  }

  // Calculate stats
  const points = profile?.points || 0
  const totalVotes = myVotes?.length || 0
  const earnedBadges = profile?.badges || []
  const currentStreak = profile?.streak || 0

  // Get products created by user (fetched via getByCreator query)
  const myProductsList = myProducts || []

  // Get user level and progress — memoized to avoid recalc on every render
  const { currentLevel, nextLevel, levelProgress } = useMemo(() => {
    const current = getUserLevel(points)
    const next = current.max === Infinity ? null : getUserLevel(current.max + 1)
    const progress = next
      ? ((points - current.min) / (next.min - current.min)) * 100
      : 100
    return { currentLevel: current, nextLevel: next, levelProgress: progress }
  }, [points])

  // Combine votes and products for activity feed — memoized (merge + sort + slice)
  const activities = useMemo(() => [
    ...(myVotes?.map(v => ({
      type: 'vote' as const,
      timestamp: v.createdAt,
      productId: v.productId,
      data: { safety: v.safety, taste: v.taste, storeName: v.storeName, price: v.price },
    })) || []),
    ...(myProductsList.map(p => ({
      type: 'product' as const,
      timestamp: p.createdAt,
      productId: p._id,
      data: { name: p.name, voteCount: p.voteCount },
    }))),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20),
    [myVotes, myProductsList]
  )

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Mobile-first profile layout */}
      <div className="max-w-3xl mx-auto w-full px-4 py-3 space-y-4">

        {/* User Header Card */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-foreground truncate">
                  {user.name || t('profile.anonymousUser')}
                </h1>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                <Badge
                  className="mt-2"
                  style={{ backgroundColor: currentLevel.color, color: '#fff' }}
                >
                  {currentLevel.title}
                </Badge>
              </div>
            </div>

            {/* Level Progress Bar */}
            {nextLevel && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t('profile.xp', { points })}</span>
                  <span>{t('profile.nextLevel', { points: nextLevel.min })}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.min(levelProgress, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatsCard
            title={t('gamification.points')}
            value={points}
            icon={<Trophy className="h-5 w-5 text-amber-500" />}
          />
          <StatsCard
            title={t('gamification.streak')}
            value={`${currentStreak}d`}
            icon={<Flame className="h-5 w-5 text-orange-500" />}
          />
          <StatsCard
            title={t('common.votes')}
            value={totalVotes}
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
          />
          <StatsCard
            title={t('profile.products')}
            value={myProductsList.length}
            icon={<Star className="h-5 w-5 text-primary" />}
          />
          <StatsCard
            title={t('profile.followers')}
            value={followCounts?.followers ?? 0}
            icon={<Users className="h-5 w-5 text-primary" />}
          />
          <StatsCard
            title={t('profile.following')}
            value={followCounts?.following ?? 0}
            icon={<Users className="h-5 w-5 text-primary" />}
          />
        </div>

        {/* Badges Section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">{t('gamification.badges')}</h2>
          <BadgeDisplay earnedBadgeIds={earnedBadges} />
        </div>

        {/* Leaderboard Section (moved from dedicated tab) */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            {t('profile.leaderboardSection')}
          </h2>
          <Leaderboard />
        </div>

        {/* Dietary Preferences Section */}
        <div>
          <DietaryProfileSettings />
        </div>

        {/* Settings Section — contains functionality from TopBar (hidden on mobile) */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            {t('profile.settings')}
          </h2>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-0 divide-y divide-border">
              <ProfileSettings
                coords={coords}
                geoLoading={geoLoading}
                requestLocation={requestLocation}
                nearbyRangeKm={nearbyRangeKm}
                onNearbyRangeChange={(km) => { setNearbyRange(km); setNearbyRangeKm(km) }}
                locale={locale}
                setLocale={setLocale}
                cycleTheme={cycleTheme}
                themeLabel={themeLabel}
                ThemeIcon={ThemeIcon}
                onSignOut={handleSignOut}
                t={t}
              />
            </CardContent>
          </Card>
        </div>

        {/* Contributions Feed */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">{t('profile.recentActivity')}</h2>
          <ProfileActivityFeed
            activities={activities}
            products={myProductsList}
            locale={locale}
            t={t}
          />
        </div>
      </div>
    </div>
  )
}
