import { Link, useNavigate } from '@tanstack/react-router'
import { appConfig } from '@/lib/app-config'
import { useConvexAuth } from '@convex-dev/react-query'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { LogOut, MapPin, Trophy } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { ScoutCard } from '@/components/dashboard/ScoutCard'
import { useGeolocation } from '@/hooks/use-geolocation'
import { motion } from 'framer-motion'

/**
 * Top navigation bar
 * Logo/app name (left) + location icon + points badge + user avatar or Sign In button (right)
 * Fixed at top, minimal height (48px)
 */
export function TopBar() {
  const { isAuthenticated } = useConvexAuth()
  const navigate = useNavigate()
  const profile = useQuery(api.profiles.getCurrent)
  const { coords, loading: geoLoading, requestLocation } = useGeolocation()

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate({ to: '/login' })
  }

  // Determine location icon color
  const getLocationColor = () => {
    if (geoLoading) return 'text-color-text-secondary'
    if (coords) return 'text-color-safety-high' // Green
    return 'text-color-text-secondary' // Gray
  }

  const getLocationTitle = () => {
    if (geoLoading) return 'Getting location...'
    if (coords) return 'Location enabled'
    return 'Tap to enable location'
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

      {/* Right: Location Icon + Points Badge + Auth */}
      <div className="flex items-center gap-2">
        {/* Location Status Icon */}
        <motion.button
          onClick={requestLocation}
          className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${getLocationColor()}`}
          title={getLocationTitle()}
          whileTap={{ scale: 0.95 }}
        >
          <MapPin className="h-4 w-4" />
        </motion.button>

        {/* Points Badge with Popover (only for authenticated users) */}
        {isAuthenticated && profile && (
          <Popover>
            <PopoverTrigger asChild>
              <motion.button
                className="h-8 px-3 bg-color-gold text-white rounded-lg flex items-center gap-1.5 font-bold text-sm hover:bg-color-gold/90 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Trophy className="h-3.5 w-3.5" />
                <span>{profile.points || 0}</span>
              </motion.button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="end">
              <ScoutCard />
            </PopoverContent>
          </Popover>
        )}

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
