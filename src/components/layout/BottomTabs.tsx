import { Link, useLocation } from '@tanstack/react-router'
import { Grid3X3, BarChart3, Plus, User, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddProductDialog } from '@/components/dashboard/AddProductDialog'
import { useConvexAuth } from '@convex-dev/react-query'

/**
 * Bottom tab navigation bar (mobile-optimized)
 * 5 tabs: Home, Leaderboard, Add (center), Map, Profile
 * Fixed at bottom with iOS safe area
 */
export function BottomTabs() {
  const location = useLocation()
  const { isAuthenticated } = useConvexAuth()

  const isActive = (path: string) => {
    // Simple path matching for active state
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const tabClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1 flex-1 h-16 text-xs font-medium transition-colors ${
      active
        ? 'text-color-primary bg-white/50'
        : 'text-color-text-secondary hover:text-color-text'
    }`

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-color-border flex items-center justify-around safe-area-inset-bottom">
        {/* Home Tab */}
        <Link
          to="/"
          className={tabClass(isActive('/'))}
          activeProps={{ className: tabClass(true) }}
        >
          <Grid3X3 className="h-6 w-6" />
          <span>Home</span>
        </Link>

        {/* Leaderboard Tab */}
        <Link
          to="/leaderboard"
          className={tabClass(isActive('/leaderboard'))}
          activeProps={{ className: tabClass(true) }}
        >
          <BarChart3 className="h-6 w-6" />
          <span>Leaderboard</span>
        </Link>

        {/* Add Tab (Center, larger button) */}
        {isAuthenticated ? (
          <AddProductDialog
            trigger={
              <Button
                className="rounded-full w-12 h-12 p-0 bg-color-primary hover:bg-color-primary-dark text-white shadow-lg -mt-6 flex items-center justify-center"
                title="Add product"
              >
                <Plus className="h-6 w-6" />
              </Button>
            }
          />
        ) : (
          <Button
            onClick={() => {
              window.location.href = '/login'
            }}
            className="rounded-full w-12 h-12 p-0 bg-color-primary hover:bg-color-primary-dark text-white shadow-lg -mt-6 flex items-center justify-center"
            title="Sign in to add product"
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}

        {/* Map Tab */}
        <Link
          to="/map"
          className={tabClass(isActive('/map'))}
          activeProps={{ className: tabClass(true) }}
        >
          <Map className="h-6 w-6" />
          <span>Map</span>
        </Link>

        {/* Profile Tab */}
        <Link
          to="/profile"
          className={tabClass(isActive('/profile'))}
          activeProps={{ className: tabClass(true) }}
        >
          <User className="h-6 w-6" />
          <span>Profile</span>
        </Link>
      </nav>

      {/* AddProductDialog is rendered outside to maintain dialog state */}
    </>
  )
}
