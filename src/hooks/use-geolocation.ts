import { useState, useCallback, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

interface Coordinates {
  latitude: number
  longitude: number
}

interface GeolocationState {
  coords: Coordinates | null
  loading: boolean
  error: string | null
  permissionStatus: 'prompt' | 'granted' | 'denied' | null
}

/**
 * Hook to request and manage user's GPS coordinates
 * 
 * Uses the appropriate API based on platform:
 * - Native: @capacitor/geolocation plugin (better permissions, more reliable)
 * - Web: navigator.geolocation API
 * 
 * Used for tagging products with store locations and filtering by "Near Me"
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    loading: false,
    error: null,
    permissionStatus: null,
  })

  const isNative = Capacitor.isNativePlatform()

  /**
   * Check current permission status
   */
  const checkPermissions = useCallback(async () => {
    if (isNative) {
      try {
        const { Geolocation } = await import('@capacitor/geolocation')
        const result = await Geolocation.checkPermissions()
        const status = result.location === 'granted' ? 'granted' : 
                       result.location === 'denied' ? 'denied' : 'prompt'
        setState(prev => ({ ...prev, permissionStatus: status }))
        return status
      } catch (error) {
        console.error('Failed to check permissions:', error)
        return 'denied'
      }
    } else {
      // Web doesn't have permission status API
      return navigator.geolocation ? 'granted' : 'denied'
    }
  }, [isNative])

  /**
   * Request location permissions explicitly (native only)
   */
  const requestPermissions = useCallback(async () => {
    if (!isNative) return 'granted'

    try {
      const { Geolocation } = await import('@capacitor/geolocation')
      const result = await Geolocation.requestPermissions()
      const status = result.location === 'granted' ? 'granted' : 'denied'
      setState(prev => ({ ...prev, permissionStatus: status }))
      return status
    } catch (error) {
      console.error('Failed to request permissions:', error)
      setState(prev => ({ ...prev, permissionStatus: 'denied' }))
      return 'denied'
    }
  }, [isNative])

  /**
   * Request user's current location
   */
  const requestLocation = useCallback(async () => {
    if (isNative) {
      // Native path: Use Capacitor Geolocation plugin
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }))

        const { Geolocation } = await import('@capacitor/geolocation')
        
        // Check permissions first
        const permStatus = await checkPermissions()
        if (permStatus !== 'granted') {
          // Request permissions if not granted
          const requestStatus = await requestPermissions()
          if (requestStatus !== 'granted') {
            setState({
              coords: null,
              loading: false,
              error: 'Location permission denied. Enable in Settings → Privacy → Location Services.',
              permissionStatus: 'denied',
            })
            return
          }
        }

        // Get current position
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })

        setState({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          loading: false,
          error: null,
          permissionStatus: 'granted',
        })
      } catch (error: any) {
        console.error('Geolocation error:', error)
        let errorMessage = 'Failed to get location'
        
        if (error.message?.includes('permission')) {
          errorMessage = 'Location permission denied'
        } else if (error.message?.includes('unavailable')) {
          errorMessage = 'Location service unavailable'
        } else if (error.message?.includes('timeout')) {
          errorMessage = 'Location request timed out'
        }

        setState({
          coords: null,
          loading: false,
          error: errorMessage,
          permissionStatus: error.message?.includes('permission') ? 'denied' : state.permissionStatus,
        })
      }
    } else {
      // Web path: Use browser geolocation API
      if (!navigator.geolocation) {
        setState({
          coords: null,
          loading: false,
          error: 'Geolocation is not supported by your browser',
          permissionStatus: 'denied',
        })
        return
      }

      setState((prev) => ({ ...prev, loading: true, error: null }))

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            loading: false,
            error: null,
            permissionStatus: 'granted',
          })
        },
        (error) => {
          let errorMessage = 'Failed to get location'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out'
              break
          }

          setState({
            coords: null,
            loading: false,
            error: errorMessage,
            permissionStatus: error.code === error.PERMISSION_DENIED ? 'denied' : state.permissionStatus,
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    }
  }, [isNative, checkPermissions, requestPermissions, state.permissionStatus])

  /**
   * Clear current location
   */
  const clearLocation = useCallback(() => {
    setState({
      coords: null,
      loading: false,
      error: null,
      permissionStatus: null,
    })
  }, [])

  // Check permissions on mount
  useEffect(() => {
    checkPermissions()
  }, [checkPermissions])

  return {
    coords: state.coords,
    loading: state.loading,
    error: state.error,
    permissionStatus: state.permissionStatus,
    requestLocation,
    clearLocation,
    checkPermissions,
    requestPermissions,
  }
}

/**
 * Calculate distance between two coordinates in kilometers
 * Using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
