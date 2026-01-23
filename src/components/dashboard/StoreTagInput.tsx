import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useGeolocation } from '@/hooks/use-geolocation'
import { MapPin, Loader2, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface StoreTagInputProps {
  value: string
  onChange: (value: string) => void
  onLocationCapture?: (lat: number, lon: number) => void
  disabled?: boolean
}

/**
 * Store tag input with optional GPS location capture
 * Allows users to tag where they purchased the product
 */
export function StoreTagInput({
  value,
  onChange,
  onLocationCapture,
  disabled = false,
}: StoreTagInputProps) {
  const { coords, loading, error, requestLocation } = useGeolocation()
  const [hasLocation, setHasLocation] = useState(false)
  const pendingCapture = useRef(false)

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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label htmlFor="store-input" className="text-sm font-medium">
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
        <Input
          id="store-input"
          type="text"
          placeholder="e.g., Whole Foods Market"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1"
        />

        <Button
          type="button"
          variant={hasLocation ? 'secondary' : 'outline'}
          size="icon"
          onClick={hasLocation ? handleClearLocation : handleCaptureLocation}
          disabled={disabled || loading}
          title={hasLocation ? 'Clear location' : 'Capture GPS location'}
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
