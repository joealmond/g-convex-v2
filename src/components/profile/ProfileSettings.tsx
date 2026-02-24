
import { MapPin, Radar, Languages, LogOut } from 'lucide-react'
import { LanguageSelector } from '@/components/profile/LanguageSelector'
import { NEARBY_RANGE_OPTIONS, setDefaultNearbyRange } from '@/hooks/use-product-filter'
import { toast } from 'sonner'
import { isNative } from '@/lib/platform'
import type { LucideIcon } from 'lucide-react'
import type { Locale } from '@/lib/i18n'

interface ProfileSettingsProps {
  coords: { latitude: number; longitude: number } | null
  geoLoading: boolean
  requestLocation: () => void
  permissionStatus: 'prompt' | 'granted' | 'denied' | null
  nearbyRangeKm: number
  onNearbyRangeChange: (km: number) => void
  locale: string
  setLocale: (locale: Locale) => void
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
  permissionStatus,
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
    <div className="divide-y divide-border w-full">
      {/* Location */}
      <button
        onClick={() => {
            if (permissionStatus === 'denied') {
              if (isNative()) {
                toast.error(t('location.deniedNativeToast', { defaultValue: 'Location blocked. Please enable it in your device Settings → Privacy.' }))
              } else {
                toast.error(t('location.deniedWebToast', { defaultValue: 'Location blocked. Please click the lock icon in your browser address bar to enable it.' }))
              }
            } else {
              requestLocation()
            }
          }}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <MapPin className={`h-5 w-5 ${coords ? 'text-blue-500' : 'text-muted-foreground'}`} />
          <span className="text-sm font-medium text-foreground">{t('profile.locationStatus')}</span>
        </div>
        <span className={`text-xs select-none ${coords ? 'text-blue-500' : 'text-muted-foreground'}`}>
          {geoLoading ? '...' : coords ? t('profile.locationOn') : t('profile.locationOff')}
        </span>
      </button>

      {/* Default Nearby Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 gap-3">
        <div className="flex items-center gap-3 shrink-0">
          <Radar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{t('profile.nearbyRange')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {NEARBY_RANGE_OPTIONS.map((km) => (
            <button
              key={km}
              onClick={() => {
                setDefaultNearbyRange(km)
                onNearbyRangeChange(km)
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                nearbyRangeKm === km ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10'
              }`}
            >
              {km}km
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <Languages className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{t('profile.language')}</span>
        </div>
        <LanguageSelector locale={locale} setLocale={setLocale} />
      </div>

      {/* Theme */}
      <button
        onClick={cycleTheme}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
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
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-destructive/10 transition-colors"
      >
        <LogOut className="h-5 w-5 text-destructive" />
        <span className="text-sm font-medium text-destructive">{t('profile.signOutButton')}</span>
      </button>
    </div>
  )
}
