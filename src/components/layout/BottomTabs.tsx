import { Link, useLocation } from '@tanstack/react-router'
import { Grid3X3, MessageCircle, Plus, User, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddProductDialog } from '@/components/dashboard/AddProductDialog'
import { useTranslation } from '@/hooks/use-translation'

/**
 * Bottom tab navigation bar (mobile-optimized)
 * 5 tabs: Home, Community, Add (center), Map, Profile
 * Fixed at bottom with iOS safe area
 * 
 * Light mode: Sage Green (#7CB342) with white icons
 * Dark mode: Slate (#1E293B) with light icons, amber active
 */
export function BottomTabs() {
  const { t } = useTranslation()
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const tabClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 h-16 text-[10px] font-medium transition-colors ${
      active
        ? 'text-[var(--nav-active)]'
        : 'text-[var(--nav-muted)] hover:text-[var(--nav-foreground)]'
    }`

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col border-t border-white/20 dark:border-border"
        style={{ backgroundColor: 'var(--nav-bg)' }}
      >
        <div className="h-16 flex items-center justify-around relative">
        {/* Home Tab */}
        <Link
          to="/"
          className={tabClass(isActive('/'))}
          activeProps={{ className: tabClass(true) }}
        >
          <Grid3X3 className="h-7 w-7" />
          <span>{t('nav.home')}</span>
        </Link>

        {/* Community Tab */}
        <Link
          to="/community"
          className={tabClass(isActive('/community'))}
          activeProps={{ className: tabClass(true) }}
        >
          <MessageCircle className="h-7 w-7" />
          <span>{t('nav.community')}</span>
        </Link>

        {/* Add Tab (Center, elevated circle) */}
        <div className="flex flex-col items-center justify-center flex-1">
          <AddProductDialog
            trigger={
              <Button
                className="rounded-full w-[4.5rem] h-[4.5rem] p-0 bg-white text-primary hover:bg-white/90 dark:bg-accent dark:text-accent-foreground shadow-lg -mt-8 flex items-center justify-center border-4 border-[var(--nav-bg)]"
                title={t('common.addProduct')}
                aria-label={t('common.addProduct')}
              >
                <Plus className="h-8 w-8" />
              </Button>
            }
          />
        </div>

        {/* Map Tab */}
        <Link
          to="/map"
          className={tabClass(isActive('/map'))}
          activeProps={{ className: tabClass(true) }}
        >
          <Map className="h-7 w-7" />
          <span>{t('nav.map')}</span>
        </Link>

        {/* Profile Tab */}
        <Link
          to="/profile"
          className={tabClass(isActive('/profile'))}
          activeProps={{ className: tabClass(true) }}
        >
          <User className="h-7 w-7" />
          <span>{t('nav.profile')}</span>
        </Link>
        </div>
        {/* Safe area spacer for devices with home indicator */}
        <div className="safe-bottom" style={{ backgroundColor: 'var(--nav-bg)' }} />
      </nav>
    </>
  )
}

