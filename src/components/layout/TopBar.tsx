import { Link, useNavigate } from '@tanstack/react-router'
import { appConfig } from '@/lib/app-config'
import { useConvexAuth } from '@convex-dev/react-query'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

/**
 * Top navigation bar
 * Logo/app name (left) + user avatar or Sign In button (right)
 * Fixed at top, minimal height (48px)
 */
export function TopBar() {
  const { isAuthenticated } = useConvexAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate({ to: '/login' })
  }

  return (
    <header className="sticky top-0 z-50 h-12 bg-color-bg border-b border-color-border flex items-center justify-between px-4 sm:px-6">
      {/* Left: Logo/App Name */}
      <Link to="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-lg bg-color-primary flex items-center justify-center">
          <span className="text-white font-bold text-sm">G</span>
        </div>
        <span className="hidden sm:inline text-color-text">{appConfig.appName}</span>
      </Link>

      {/* Right: Auth Avatar or Sign In Button */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="bg-color-primary text-white text-xs font-bold">
                U
              </AvatarFallback>
            </Avatar>

            {/* Sign Out Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 text-color-text-secondary hover:text-color-text"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => navigate({ to: '/login' })}
            className="bg-color-primary hover:bg-color-primary-dark text-white h-8 px-4 text-sm rounded-lg"
          >
            Sign In
          </Button>
        )}
      </div>
    </header>
  )
}
