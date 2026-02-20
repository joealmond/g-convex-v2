import { Link } from '@tanstack/react-router'
import { ClientOnly } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Trophy, User, LogOut, LogIn, Menu, Shield, Loader2, MessageCircle } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useAdmin } from '@/hooks/use-admin'
import { useTranslation } from '@/hooks/use-translation'

/** Loading fallback for auth section */
function AuthLoadingFallback() {
  return (
    <div className="h-10 w-10 rounded-full bg-muted animate-pulse flex items-center justify-center">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </div>
  )
}

/** Auth section - rendered client-only */
function AuthSection() {
  const user = useQuery(api.users.current)
  const profile = useQuery(api.profiles.getCurrent)
  const { isAdmin } = useAdmin()
  const { t } = useTranslation()

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = '/'
  }

  if (!user) {
    return (
      <Button asChild size="sm">
        <Link to="/login">
          <LogIn className="mr-2 h-4 w-4" />
          {t('nav.signIn')}
        </Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback>
              {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || t('nav.user')}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profile && (
          <DropdownMenuItem disabled className="text-xs">
            <Trophy className="mr-2 h-4 w-4" />
            {profile.points} {t('gamification.points')}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            {t('nav.profile')}
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              {t('nav.adminPanel')}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          {t('nav.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Mobile auth items - rendered client-only */
function MobileAuthItems() {
  const user = useQuery(api.users.current)
  const { isAdmin } = useAdmin()
  const { t } = useTranslation()

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = '/'
  }

  if (!user) {
    return (
      <DropdownMenuItem asChild>
        <Link to="/login" className="cursor-pointer">
          <LogIn className="mr-2 h-4 w-4" />
          {t('nav.signIn')}
        </Link>
      </DropdownMenuItem>
    )
  }

  return (
    <>
      <DropdownMenuItem asChild>
        <Link to="/profile" className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          {t('nav.profile')}
        </Link>
      </DropdownMenuItem>
      {isAdmin && (
        <DropdownMenuItem asChild>
          <Link to="/admin" className="cursor-pointer">
            <Shield className="mr-2 h-4 w-4" />
            {t('nav.adminPanel')}
          </Link>
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={handleSignOut}>
        <LogOut className="mr-2 h-4 w-4" />
        {t('nav.signOut')}
      </DropdownMenuItem>
    </>
  )
}

/**
 * Main navigation header with user menu
 */
export function Navigation() {
  const { t } = useTranslation()
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-2xl">🌾</span>
            <span>{t('nav.appName')}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/community"
              className="text-sm font-medium transition-colors hover:text-primary inline-flex items-center gap-1"
            >
              <MessageCircle className="h-4 w-4" />
              {t('nav.community')}
            </Link>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Auth-dependent UI - client only to prevent hydration mismatch */}
            <ClientOnly fallback={<AuthLoadingFallback />}>
              <AuthSection />
            </ClientOnly>
          </nav>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/" className="cursor-pointer">
                    {t('nav.home')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/community" className="cursor-pointer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {t('nav.community')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <ClientOnly fallback={null}>
                  <MobileAuthItems />
                </ClientOnly>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
