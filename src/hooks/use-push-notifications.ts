/**
 * Push notifications hook for OneSignal on Capacitor native apps.
 *
 * Handles:
 * - OneSignal initialization (once, at app startup)
 * - Linking the device to the authenticated user via external_id
 * - Permission request wrapper
 * - Notification click listener for deep linking
 *
 * OneSignal manages device tokens internally — no Convex deviceTokens table needed.
 *
 * ⚠️  SETUP REQUIRED: Set VITE_ONESIGNAL_APP_ID in .env
 * See docs/PUSH_NOTIFICATIONS_SETUP.md for full configuration.
 */
import { useEffect, useRef, useCallback } from 'react'
import { isNative } from '@/lib/platform'
import {
  initOneSignal,
  oneSignalLogin,
  oneSignalLogout,
  requestPushPermission,
  onNotificationClick,
} from '@/lib/onesignal'

/**
 * Register for push notifications via OneSignal on native platforms.
 *
 * @param userId - The authenticated user's ID (skip registration if undefined)
 * @returns { requestPermission, isSupported }
 */
export function usePushNotifications(userId: string | undefined) {
  const isSupported = isNative()
  const prevUserIdRef = useRef<string | undefined>(undefined)

  // Initialize OneSignal once on mount
  useEffect(() => {
    if (!isSupported) return
    initOneSignal()
  }, [isSupported])

  // Login/logout when userId changes
  useEffect(() => {
    if (!isSupported) return

    const prevUserId = prevUserIdRef.current
    prevUserIdRef.current = userId

    if (userId && userId !== prevUserId) {
      // User logged in or switched accounts
      oneSignalLogin(userId)
    } else if (!userId && prevUserId) {
      // User logged out
      oneSignalLogout()
    }
  }, [isSupported, userId])

  // Setup notification click listener for deep linking
  useEffect(() => {
    if (!isSupported || !userId) return

    let cleanup: (() => void) | undefined

    onNotificationClick((notification) => {
      console.log('[Push] Notification tapped:', notification.title, notification.data)
      // TODO: Navigate based on notification.data (e.g., product detail, community)
    }).then((fn) => {
      cleanup = fn
    })

    return () => {
      cleanup?.()
    }
  }, [isSupported, userId])

  const requestPermission = useCallback(async () => {
    if (!isSupported || !userId) return false
    return requestPushPermission(false)
  }, [isSupported, userId])

  return { requestPermission, isSupported }
}
