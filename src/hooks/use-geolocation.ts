import { useState, useCallback } from 'react'

interface Coordinates {
  latitude: number
  longitude: number
}

interface GeolocationState {
  coords: Coordinates | null
  loading: boolean
  error: string | null
}

/**
 * Hook to request and manage user's GPS coordinates
 * 
 * Used for tagging products with store locations and filtering by "Near Me"
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    loading: false,
    error: null,
  })

  /**
   * Request user's current location
   */
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        coords: null,
        loading: false,
        error: 'Geolocation is not supported by your browser',
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
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [])

  /**
   * Clear current location
   */
  const clearLocation = useCallback(() => {
    setState({
      coords: null,
      loading: false,
      error: null,
    })
  }, [])

  return {
    coords: state.coords,
    loading: state.loading,
    error: state.error,
    requestLocation,
    clearLocation,
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
