import { useState, useEffect } from 'react'

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
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    let mounted = true
    let registration: ServiceWorkerRegistration | null = null

    void navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        if (!mounted) return
        registration = reg
      })
      .catch((err) => {
        console.warn('Service worker registration failed:', err)
      })

    // Check for updates periodically (every 60 minutes)
    const intervalId = setInterval(() => {
      if (registration) void registration.update()
    }, 60 * 60 * 1000)

    return () => {
      mounted = false
      clearInterval(intervalId)
    }
  }, [])

  return { registration: null }
}
