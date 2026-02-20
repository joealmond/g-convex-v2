import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Radar, Languages, LogOut } from 'lucide-react'
import { NEARBY_RANGE_OPTIONS } from '@/hooks/use-product-filter'
import type { LucideIcon } from 'lucide-react'

interface ProfileSettingsProps {
  coords: { latitude: number; longitude: number } | null
  geoLoading: boolean
  requestLocation: () => void
  nearbyRangeKm: number
  onNearbyRangeChange: (km: number) => void
  locale: string
  setLocale: (locale: string) => void
  cycleTheme: () => void
  themeLabel: string
  ThemeIcon: LucideIcon
  onSignOut: () => void
  t: (key: string, params?: Record<string, string | number>) => string
}

/**
 * Profile settings card: location, nearby range, language, theme, sign out
 */
export function ProfileSettings({
  coords,
  geoLoading,
  requestLocation,
  nearbyRangeKm,
  onNearbyRangeChange,
  locale,
  setLocale,
  cycleTheme,
  themeLabel,
  ThemeIcon,
  onSignOut,
  t,
}: ProfileSettingsProps) {
  return (
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
                onClick={() => onNearbyRangeChange(km)}
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
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5 text-destructive" />
          <span className="text-sm font-medium text-destructive">{t('profile.signOutButton')}</span>
        </button>
      </CardContent>
    </Card>
  )
}
