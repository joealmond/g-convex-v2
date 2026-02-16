import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Suspense, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Trophy, Flame, Star, Users, Calendar, TrendingUp, MapPin, Moon, Sun, Monitor, LogOut, Settings, Languages, Radar } from 'lucide-react'
import { getQuadrant, QUADRANTS } from '@/lib/types'
// import { BADGES } from '@convex/lib/gamification'
import { getUserLevel, appConfig } from '@/lib/app-config'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { BadgeDisplay } from '@/components/dashboard/BadgeDisplay'
import { DietaryProfileSettings } from '@/components/dashboard/DietaryProfileSettings'
import { Leaderboard } from '@/components/dashboard/Leaderboard'
import { useTranslation } from '@/hooks/use-translation'
import { useGeolocation, useTheme } from '@/hooks'
import { useConvexAuth } from '@convex-dev/react-query'
import { authClient } from '@/lib/auth-client'
import { getNearbyRange, setNearbyRange, NEARBY_RANGE_OPTIONS } from '@/hooks/use-product-filter'


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
  const products = useQuery(api.products.listAll)
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

  // Get products created by user
  const myProducts = products?.filter(p => p.createdBy === user._id) || []

  // Get user level and progress
  const currentLevel = getUserLevel(points)
  const nextLevel = currentLevel.max === Infinity ? null : getUserLevel(currentLevel.max + 1)
  const levelProgress = nextLevel
    ? ((points - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100
    : 100

  // Combine votes and products for activity feed
  const activities = [
    ...(myVotes?.map(v => ({
      type: 'vote' as const,
      timestamp: v.createdAt,
      productId: v.productId,
      data: { safety: v.safety, taste: v.taste, storeName: v.storeName, price: v.price },
    })) || []),
    ...(myProducts.map(p => ({
      type: 'product' as const,
      timestamp: p.createdAt,
      productId: p._id,
      data: { name: p.name, voteCount: p.voteCount },
    }))),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20)

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
            value={myProducts.length}
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
              {/* Location */}
              <button
                onClick={requestLocation}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MapPin className={`h-5 w-5 ${coords ? 'text-blue-500' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium text-foreground">{t('profile.locationStatus')}</span>
                </div>
                <span className={`text-xs ${coords ? 'text-blue-500' : 'text-muted-foreground'}`}>
                  {geoLoading ? '...' : coords ? t('profile.locationOn') : t('profile.locationOff')}
                </span>
              </button>

              {/* Nearby Range */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Radar className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{t('profile.nearbyRange')}</span>
                </div>
                <div className="flex gap-1">
                  {NEARBY_RANGE_OPTIONS.map((km) => (
                    <button
                      key={km}
                      onClick={() => { setNearbyRange(km); setNearbyRangeKm(km) }}
                      className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                        nearbyRangeKm === km ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {km}km
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Languages className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{t('profile.language')}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setLocale('en')}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${locale === 'en' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                  >
                    🇬🇧 EN
                  </button>
                  <button
                    onClick={() => setLocale('hu')}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${locale === 'hu' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                  >
                    🇭🇺 HU
                  </button>
                </div>
              </div>

              {/* Theme */}
              <button
                onClick={cycleTheme}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ThemeIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{t('profile.themeLabel')}</span>
                </div>
                <span className="text-xs text-muted-foreground">{themeLabel}</span>
              </button>

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium text-destructive">{t('profile.signOutButton')}</span>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Contributions Feed */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">{t('profile.recentActivity')}</h2>
          {activities.length > 0 ? (
            <div className="space-y-2">
              {activities.map((activity, idx) => {
                const product = products?.find(p => p._id === activity.productId)
                if (!product) return null

                if (activity.type === 'vote') {
                  const quadrant = getQuadrant(
                    activity.data.safety || 50,
                    activity.data.taste || 50
                  )
                  const quadrantInfo = QUADRANTS[quadrant]

                  return (
                    <Card key={`vote-${idx}`} className="rounded-xl shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <TrendingUp className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">
                              {t('profile.votedOn')}{' '}
                              <Link
                                to="/product/$name"
                                params={{ name: encodeURIComponent(product.name) }}
                                className="font-semibold hover:underline"
                              >
                                {product.name}
                              </Link>
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Badge
                                variant="secondary"
                                className="text-xs"
                                style={{
                                  backgroundColor: quadrantInfo?.color || '#888',
                                  color: '#fff',
                                  opacity: 0.9,
                                }}
                              >
                                {appConfig.quadrants[quadrant as keyof typeof appConfig.quadrants]?.emoji} {quadrantInfo?.name || 'Unknown'}
                              </Badge>
                              {activity.data.storeName && (
                                <span>• {activity.data.storeName}</span>
                              )}
                              <span>
                                • {new Date(activity.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                }

                // Product contribution
                return (
                  <Card key={`product-${idx}`} className="rounded-xl shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <Star className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            {t('profile.added')}{' '}
                            <Link
                              to="/product/$name"
                              params={{ name: encodeURIComponent(product.name) }}
                              className="font-semibold hover:underline"
                            >
                              {product.name}
                            </Link>
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>
                              <Users className="inline h-3 w-3 mr-1" />
                              {activity.data.voteCount} {t('common.votes')}
                            </span>
                            <span>
                              • {new Date(activity.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="rounded-xl shadow-sm">
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  {t('profile.noActivity')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
