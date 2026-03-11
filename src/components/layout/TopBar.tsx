import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { lazy, Suspense, useState, useSyncExternalStore } from 'react'
import { appConfig } from '@/lib/app-config'
import { useConvexAuth } from '@convex-dev/react-query'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Grid3X3, Loader2, LogOut, Map, MapPin, MessageCircle, Monitor, Moon, Plus, Shield, Sun, Trophy, User } from 'lucide-react'
import { authClient, useSession } from '@/lib/auth-client'
import { useGeolocation, useTheme } from '@/hooks'
import { useAdmin } from '@/hooks/use-admin'
import { useTranslation } from '@/hooks/use-translation'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { cn } from '@/lib/utils'
import { isWeb } from '@/lib/platform'

const LazyScoutCard = lazy(() =>
  import('@/components/dashboard/ScoutCard').then((module) => ({ default: module.ScoutCard }))
)
const LazyAddProductDialog = lazy(() =>
  import('@/components/dashboard/AddProductDialog').then((module) => ({ default: module.AddProductDialog }))
)

function subscribeToHydration() {
  return () => {}
}

/**
 * Top navigation bar
 * Logo/app name (left) + location icon + points badge + user avatar or Sign In button (right)
 * Fixed at top, minimal height (48px)
 */
export function TopBar() {
  const { t } = useTranslation()
  const { isAuthenticated } = useConvexAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const profile = useQuery(api.profiles.getCurrent)
  const { coords, loading: geoLoading, requestLocation } = useGeolocation()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { data: session } = useSession()
  const { isAdmin } = useAdmin()
  const isHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false)
  const [shouldLoadAddDialog, setShouldLoadAddDialog] = useState(false)
  const isBrowser = isWeb()

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate({ to: '/login' })
  }

  // Location icon: gray when off, blue when active
  const getLocationColor = () => {
    if (geoLoading) return 'text-muted-foreground'
    if (coords) return 'text-blue-500' // Blue when active (per design)
    return 'text-muted-foreground'
  }

  const getLocationTitle = () => {
    if (geoLoading) return t('location.gettingLocation')
    if (coords) return t('location.locationEnabled')
    return t('location.tapToEnable')
  }

  // Theme icon based on current setting
  const ThemeIcon = theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun

  // Cycle through themes: light -> dark -> system -> light
  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const getThemeTitle = () => {
    if (theme === 'system') return t('theme.system')
    if (theme === 'dark') return t('theme.dark')
    return t('theme.light')
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const navItems = [
    { to: '/', label: t('nav.home'), icon: Grid3X3 },
    { to: '/community', label: t('nav.community'), icon: MessageCircle },
    { to: '/map', label: t('nav.map'), icon: Map },
    { to: '/profile', label: t('nav.profile'), icon: User },
  ]

  if (isAdmin) {
    navItems.push({ to: '/admin', label: t('nav.adminPanel'), icon: Shield })
  }

  const desktopNavClass = (active: boolean) => cn(
    'inline-flex h-10 items-center gap-2 border-b-2 px-1 text-sm font-medium transition-colors whitespace-nowrap',
    active
      ? 'border-primary text-foreground'
      : 'border-transparent text-muted-foreground hover:border-primary/30 hover:text-foreground'
  )

  const addDialogTrigger = (
    <Button
      className="h-10 rounded-full px-3 shadow-sm"
      title={t('common.addProduct')}
      aria-label={t('common.addProduct')}
    >
      <Plus className="h-4 w-4" />
      <span className="hidden lg:inline">{t('common.addProduct')}</span>
    </Button>
  )

  const addDialogLoadingTrigger = (
    <Button
      className="h-10 rounded-full px-3 shadow-sm"
      title={t('common.addProduct')}
      aria-label={t('common.addProduct')}
      onClick={() => setShouldLoadAddDialog(true)}
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="hidden lg:inline">{t('common.addProduct')}</span>
    </Button>
  )

  return (
    <header className={cn(
      'sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm safe-top',
      isBrowser ? 'block' : 'hidden md:block'
    )}>
    <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
      <Link to="/" className="flex shrink-0 items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
          <span className="text-primary-foreground font-bold text-sm">G</span>
        </div>
        <span className="hidden lg:inline text-foreground">{appConfig.appName}</span>
      </Link>

      <nav className="flex min-w-0 flex-1 items-center justify-center gap-4 overflow-x-auto py-1 lg:gap-5">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className={desktopNavClass(isActive(item.to))}
              preload="intent"
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {shouldLoadAddDialog ? (
          <Suspense fallback={addDialogLoadingTrigger}>
            <LazyAddProductDialog initiallyOpen trigger={addDialogTrigger} />
          </Suspense>
        ) : (
          <Button
            className="h-10 rounded-full px-3 shadow-sm"
            title={t('common.addProduct')}
            aria-label={t('common.addProduct')}
            onClick={() => setShouldLoadAddDialog(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden lg:inline">{t('common.addProduct')}</span>
          </Button>
        )}
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        {/* Location Status Icon */}
        <button
          onClick={requestLocation}
          className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${getLocationColor()}`}
          title={getLocationTitle()}
          aria-label={getLocationTitle()}
        >
          <MapPin className="h-4 w-4" />
        </button>

        {/* Language Switcher (dropdown) */}
        <LanguageSwitcher />

        {/* Theme Toggle (3-state: light/dark/system) */}
        <button
          onClick={cycleTheme}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title={getThemeTitle()}
          aria-label={getThemeTitle()}
        >
          <ThemeIcon className="h-4 w-4" />
        </button>

        {/* Points Badge with Popover (only after client hydration) */}
        {isHydrated && isAuthenticated && profile && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="h-8 px-3 bg-amber-500 text-white rounded-lg flex items-center gap-1.5 font-bold text-sm hover:bg-amber-500/90 transition-colors"
              >
                <Trophy className="h-3.5 w-3.5" />
                <span>{profile.points || 0}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="end">
              <Suspense
                fallback={
                  <div className="w-64 p-4 space-y-3">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-background rounded" />
                      <div className="h-4 bg-background rounded" />
                      <div className="h-4 bg-background rounded" />
                    </div>
                  </div>
                }
              >
                <LazyScoutCard />
              </Suspense>
            </PopoverContent>
          </Popover>
        )}

        {isHydrated && isAuthenticated ? (
          <div className="flex items-center gap-2">
            <Link to="/profile">
              <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                {session?.user?.image && (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || 'User'} 
                    className="h-full w-full object-cover"
                  />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title={t('nav.signOut')}
              aria-label={t('nav.signOut')}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => navigate({ to: '/login' })}
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-4 text-sm rounded-lg"
          >
            {t('nav.signIn')}
          </Button>
        )}
      </div>
    </div>
    </header>
  )
}

