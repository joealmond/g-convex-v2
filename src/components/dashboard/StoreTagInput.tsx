import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGeolocation } from '@/hooks/use-geolocation'
import { useTranslation } from '@/hooks/use-translation'
import { appConfig } from '@/lib/app-config'
import { MapPin, Loader2, X, Store } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface StoreTagInputProps {
  value: string
  onChange: (value: string) => void
  onLocationCapture?: (lat: number, lon: number) => void
  disabled?: boolean
}

/**
 * Store tag input with predefined store dropdown + custom option
 * and optional GPS location capture.
 * Allows users to tag where they purchased the product.
 */
export function StoreTagInput({
  value,
  onChange,
  onLocationCapture,
  disabled = false,
}: StoreTagInputProps) {
  const { coords, loading, error, requestLocation } = useGeolocation()
  const { locale, t } = useTranslation()
  const [hasLocation, setHasLocation] = useState(false)
  const [isCustomMode, setIsCustomMode] = useState(false)
  const pendingCapture = useRef(false)

  // Get predefined stores for current locale, fallback to 'en'
  const predefinedStores = appConfig.storeDefaults[locale as keyof typeof appConfig.storeDefaults] 
    || appConfig.storeDefaults.en || []
  
  // Special value for custom input mode
  const CUSTOM_STORE_VALUE = '__custom__'

  // Check if current value is a custom store (not in predefined list)
  useEffect(() => {
    if (value && !(predefinedStores as readonly string[]).includes(value) && value !== CUSTOM_STORE_VALUE) {
      setIsCustomMode(true)
    }
  }, [value, predefinedStores, CUSTOM_STORE_VALUE])

  // Effect to handle location capture when coords change
  useEffect(() => {
    if (coords && pendingCapture.current && onLocationCapture) {
      onLocationCapture(coords.latitude, coords.longitude)
      setHasLocation(true)
      pendingCapture.current = false
    }
  }, [coords, onLocationCapture])

  const handleCaptureLocation = () => {
    pendingCapture.current = true
    requestLocation()
  }

  const handleClearLocation = () => {
    setHasLocation(false)
    if (onLocationCapture) {
      onLocationCapture(0, 0)
    }
  }
  
  const handleStoreSelect = (selectedValue: string) => {
    if (selectedValue === CUSTOM_STORE_VALUE) {
      setIsCustomMode(true)
      onChange('') // Clear value when switching to custom mode
    } else {
      setIsCustomMode(false)
      onChange(selectedValue)
    }
  }
  
  const handleCustomInputChange = (inputValue: string) => {
    onChange(inputValue)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label htmlFor="store-input" className="text-sm font-medium flex items-center gap-1.5">
          <Store className="h-4 w-4 text-primary" />
          {t('imageUpload.storeLabel')} <span className="text-xs font-normal text-muted-foreground">({t('imageUpload.storeOptional')})</span>
        </Label>
        {hasLocation && (
          <Badge variant="secondary" className="text-xs gap-1">
            <MapPin className="h-3 w-3" />
            {t('imageUpload.locationSaved')}
          </Badge>
        )}
      </div>

      <div className="flex gap-2">
        {/* Store Selector or Custom Input */}
        {isCustomMode ? (
          <>
            <Input
              id="store-input"
              type="text"
              placeholder={t('imageUpload.enterStoreName')}
              value={value}
              onChange={(e) => handleCustomInputChange(e.target.value)}
              disabled={disabled}
              className="flex-1"
              autoFocus
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCustomMode(false)
                onChange('')
              }}
              disabled={disabled}
              title={t('imageUpload.backToPredefined')}
              className="px-3 text-xs"
            >
              {t('imageUpload.cancel')}
            </Button>
          </>
        ) : (
          <Select
            value={value || ''}
            onValueChange={handleStoreSelect}
            disabled={disabled}
          >
            <SelectTrigger className="flex-1 h-10">
              <SelectValue placeholder={t('imageUpload.selectStore')} />
            </SelectTrigger>
            <SelectContent>
              {predefinedStores.map((store) => (
                <SelectItem key={store} value={store}>
                  {store}
                </SelectItem>
              ))}
              <SelectItem value={CUSTOM_STORE_VALUE} className="font-semibold text-primary">
                {t('imageUpload.addCustomStore')}
              </SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* GPS Button */}
        <Button
          type="button"
          variant={hasLocation ? 'secondary' : 'outline'}
          size="icon"
          onClick={hasLocation ? handleClearLocation : handleCaptureLocation}
          disabled={disabled || loading}
          title={hasLocation ? t('imageUpload.clearLocation') : t('imageUpload.captureLocation')}
          className="shrink-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : hasLocation ? (
            <X className="h-4 w-4" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive">
          {t('imageUpload.locationError')}: {error}
        </p>
      )}

      {coords && !hasLocation && (
        <p className="text-xs text-muted-foreground">
          {t('imageUpload.currentLocation')}: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        {t('imageUpload.storeHelpText')}
      </p>
    </div>
  )
}
