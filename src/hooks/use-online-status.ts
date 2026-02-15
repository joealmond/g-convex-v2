import { useState, useEffect, useCallback } from 'react'

/**
 * Hook for tracking online/offline status.
 * Works on both web and Capacitor.
 * Uses navigator.onLine + event listeners.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    // SSR-safe: default to true on server
    if (typeof navigator === 'undefined') return true
    return navigator.onLine
  })

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline }
}

/**
 * Register the service worker.
 * Call once on app mount (client-side only).
 */
export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  const register = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      setRegistration(reg)

      // Check for updates periodically (every 60 minutes)
      setInterval(() => {
        reg.update()
      }, 60 * 60 * 1000)
    } catch (err) {
      console.warn('Service worker registration failed:', err)
    }
  }, [])

  useEffect(() => {
    register()
  }, [register])

  return { registration }
}
