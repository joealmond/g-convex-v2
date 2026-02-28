import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Trophy, Flame, Star, Users, TrendingUp, Moon, Sun, Monitor, Settings, Languages, Loader2, Clock, UtensilsCrossed, MapPin, Radar, Award } from 'lucide-react'
import { LanguageSelector } from '@/components/profile/LanguageSelector'
import { getUserLevel, appConfig } from '@/lib/app-config'
import { BADGES } from '@convex/lib/gamification'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { BadgeDisplay } from '@/components/dashboard/BadgeDisplay'
import { DietaryProfileSettings } from '@/components/dashboard/DietaryProfileSettings'
import { Leaderboard } from '@/components/dashboard/Leaderboard'
import { ProfileSettings } from '@/components/profile/ProfileSettings'
import { ProfileActivityFeed } from '@/components/profile/ProfileActivityFeed'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { useTranslation } from '@/hooks/use-translation'
import { useGeolocation, useTheme } from '@/hooks'
import { useConvexAuth } from '@convex-dev/react-query'
import { authClient } from '@/lib/auth-client'
import { isNative } from '@/lib/platform'
import { getNearbyRange } from '@/hooks/use-product-filter'
import { formatRelativeTimeI18n } from '@/lib/format-time'


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

function GuestProfileContent() {
  const { t, locale, setLocale } = useTranslation()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)

  const ThemeIcon = theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun
  const themeLabel = theme === 'system' ? t('profile.themeSystem') : theme === 'dark' ? t('profile.themeDark') : t('profile.themeLight')
  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: isNative() ? '/auth/callback' : '/',
      })
      if (result.error) {
        setIsLoading(false)
      }
    } catch {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="max-w-3xl mx-auto w-full px-4 py-4 space-y-3">

        {/* Preferences row — always visible at top */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center divide-x divide-border">
              {/* Language */}
              <div className="flex-1 flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs font-medium text-foreground">{t('profile.language')}</span>
                </div>
                <LanguageSelector locale={locale} setLocale={setLocale} />
              </div>
              {/* Theme */}
              <button
                onClick={cycleTheme}
                className="flex items-center gap-2 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <ThemeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">{themeLabel}</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Sign-in section — inline, no page navigation */}
        <Card className="rounded-2xl shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-primary/30" />
          <CardContent className="px-5 pt-5 pb-5 space-y-4">

            {/* Header */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">{t('login.welcomeTo', { appName: appConfig.appName })}</h1>
              <p className="text-sm text-muted-foreground mt-1">{appConfig.tagline}</p>
            </div>

            {/* Benefits */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">{t('login.whySignIn')}</p>
              {[
                t('login.voteWeight'),
                t('login.earnPoints'),
                t('login.trackHistory'),
                t('login.accessLeaderboard'),
              ].map((benefit) => (
                <div key={benefit} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-px">✓</span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {/* ── Auth buttons slot ─────────────────────────────────────
                Add new providers here. Each gets its own button row.
            ─────────────────────────────────────────────────────────── */}
            <div className="space-y-2">
              {/* Google */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {isLoading ? t('login.signingIn') : t('login.continueGoogle')}
              </button>
              {/* Future providers go here */}
            </div>

            {/* Guest link */}
            <div className="text-center space-y-1">
              <Link to="/" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                {t('login.continueGuest')}
              </Link>
              <p className="text-xs text-muted-foreground">{t('login.guestNote')}</p>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
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
  const leaderboardResult = useQuery(api.profiles.leaderboard, { limit: 3 })
  const dietaryProfile = useQuery(api.dietaryProfiles.getUserProfile, {})
  const { coords, loading: geoLoading, requestLocation, permissionStatus } = useGeolocation()
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

  // Calculate stats (safe with defaults when data is null/undefined)
  const points = profile?.points || 0
  const totalVotes = myVotes?.length || 0
  const earnedBadges = profile?.badges || []
  const currentStreak = profile?.streak || 0
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

  // --- Early returns (AFTER all hooks) ---

  // Show loading skeleton while auth is settling
  if (isAuthLoading) {
    return <ProfileLoading />
  }

  // Show guest settings when not logged in
  if (user === null) {
    return <GuestProfileContent />
  }

  // Still loading user data
  if (user === undefined) {
    return <ProfileLoading />
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Mobile-first profile layout */}
      <div className="max-w-3xl mx-auto w-full px-4 py-3 space-y-4 flex flex-col"
        style={{ minHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))' }}
      >

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

        {/* 1. My Stats */}
        <CollapsibleSection
          title={t('profile.myStats')}
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          preview={
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                <span className="font-medium text-foreground">{points}</span>
              </span>
              <span className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                <span className="font-medium text-foreground">{currentStreak}d</span>
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-foreground">{totalVotes}</span>
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-foreground">{myProductsList.length}</span>
              </span>
            </div>
          }
        >
          <div className="p-3">
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
          </div>
        </CollapsibleSection>

        {/* 2. Recent Activity */}
        <CollapsibleSection
          title={t('profile.recentActivity')}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          preview={(() => {
            const latest = activities[0]
            if (!latest) return undefined
            const productName = latest.type === 'product'
              ? (latest.data as { name?: string }).name
              : myProductsList.find(p => p._id === latest.productId)?.name
            return (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                {latest.type === 'vote' ? (
                  <TrendingUp className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                ) : (
                  <Star className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                )}
                <span className="truncate">
                  {latest.type === 'vote'
                    ? `${t('profile.votedOn')} ${productName ?? '...'}`
                    : `${t('profile.added')} ${productName ?? '...'}`}
                </span>
                <span className="flex-shrink-0">· {formatRelativeTimeI18n(latest.timestamp, t)}</span>
              </div>
            )
          })()}
        >
          <div className="p-3">
            <ProfileActivityFeed
              activities={activities}
              products={myProductsList}
              locale={locale}
              t={t}
            />
          </div>
        </CollapsibleSection>

        {/* 3. Dietary Preferences */}
        <CollapsibleSection
          title={t('dietaryProfile.title')}
          icon={<UtensilsCrossed className="h-4 w-4 text-primary" />}
          preview={
            dietaryProfile?.conditions && dietaryProfile.conditions.length > 0 ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {dietaryProfile.conditions.map((c) => {
                  const restriction = appConfig.dietaryRestrictions.find(r => r.id === c.type)
                  return restriction ? (
                    <span key={c.type} className="flex items-center gap-0.5" title={restriction.label}>
                      <span>{restriction.emoji}</span>
                    </span>
                  ) : null
                })}
              </div>
            ) : undefined
          }
        >
          <div className="p-3">
            <DietaryProfileSettings hideHeader />
          </div>
        </CollapsibleSection>

        {/* 4. Settings */}
        <CollapsibleSection
          title={t('profile.settings')}
          icon={<Settings className="h-4 w-4 text-muted-foreground" />}
          preview={
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {coords ? (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-blue-500" />
                  <span className="font-medium text-foreground">{t('profile.locationOn')}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{t('profile.locationOff')}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Radar className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-foreground">{nearbyRangeKm} km</span>
              </span>
              <span className="flex items-center gap-1">
                <ThemeIcon className="h-3.5 w-3.5" />
                <span>{themeLabel}</span>
              </span>
            </div>
          }
        >
          <div className="divide-y divide-border">
            <ProfileSettings
              coords={coords}
              geoLoading={geoLoading}
              requestLocation={requestLocation}
              permissionStatus={permissionStatus}
              nearbyRangeKm={nearbyRangeKm}
              onNearbyRangeChange={setNearbyRangeKm}
              locale={locale}
              setLocale={setLocale}
              cycleTheme={cycleTheme}
              themeLabel={themeLabel}
              ThemeIcon={ThemeIcon}
              onSignOut={handleSignOut}
              t={t}
            />
          </div>
        </CollapsibleSection>

        {/* 5. Leaderboard */}
        <CollapsibleSection
          title={t('profile.leaderboardSection')}
          icon={<Trophy className="h-4 w-4 text-amber-500" />}
          preview={(() => {
            const lb = leaderboardResult
              ? Array.isArray(leaderboardResult) ? leaderboardResult : leaderboardResult.page
              : undefined
            const top = lb?.[0]
            return top ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Award className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                <span className="truncate font-medium text-foreground">
                  User #{top.userId.slice(-6)}
                </span>
                <span>· {top.points} {t('common.points')}</span>
              </div>
            ) : undefined
          })()}
        >
          <div className="p-3">
            <Leaderboard hideHeader />
          </div>
        </CollapsibleSection>

        {/* 6. Badges */}
        <CollapsibleSection
          title={t('gamification.badges')}
          icon={<Star className="h-4 w-4 text-primary" />}
          preview={
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {earnedBadges.length}/{BADGES.length}
              </span>
              {earnedBadges.length > 0 && (
                <span className="flex items-center gap-0.5">
                  {earnedBadges.slice(0, 4).map((badgeId) => {
                    const badge = BADGES.find(b => b.id === badgeId)
                    return badge ? <span key={badgeId}>{badge.icon}</span> : null
                  })}
                </span>
              )}
            </div>
          }
        >
          <div className="p-3">
            <BadgeDisplay earnedBadgeIds={earnedBadges} hideHeader />
          </div>
        </CollapsibleSection>

        {/* Spacer — fills remaining viewport so sections can scroll to top */}
        <div className="flex-grow" aria-hidden="true" />
      </div>
    </div>
  )
}
