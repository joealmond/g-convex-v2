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
  const { locale } = useTranslation()
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
    if (value && !predefinedStores.includes(value) && value !== CUSTOM_STORE_VALUE) {
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
          <Store className="h-4 w-4 text-color-primary" />
          Store Name (Optional)
        </Label>
        {hasLocation && (
          <Badge variant="secondary" className="text-xs gap-1">
            <MapPin className="h-3 w-3" />
            Location saved
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
              placeholder="Enter store name..."
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
              title="Back to predefined stores"
              className="px-3 text-xs"
            >
              Cancel
            </Button>
          </>
        ) : (
          <Select
            value={value || undefined}
            onValueChange={handleStoreSelect}
            disabled={disabled}
          >
            <SelectTrigger className="flex-1 h-10">
              <SelectValue placeholder="Select a store..." />
            </SelectTrigger>
            <SelectContent>
              {predefinedStores.map((store) => (
                <SelectItem key={store} value={store}>
                  {store}
                </SelectItem>
              ))}
              <SelectItem value={CUSTOM_STORE_VALUE} className="font-semibold text-color-primary">
                + Add custom store...
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
          title={hasLocation ? 'Clear location' : 'Capture GPS location'}
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
          Location error: {error}
        </p>
      )}

      {coords && !hasLocation && (
        <p className="text-xs text-muted-foreground">
          Current location: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Tag the store where you bought this. Location helps others find safe products nearby.
      </p>
    </div>
  )
}
