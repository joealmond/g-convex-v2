/**
 * Push notifications hook for Capacitor native apps.
 *
 * Handles permission requests, token registration, and listener setup.
 * Tokens are stored in the Convex `deviceTokens` table via `api.notifications.registerToken`.
 *
 * ⚠️  SETUP REQUIRED: Push notifications need external configuration before they work.
 * See docs/PUSH_NOTIFICATIONS_SETUP.md for Firebase (Android) and APNs (iOS) setup.
 */
import { useEffect, useRef, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { isNative, isIOS } from '@/lib/platform'

type PushListenerCleanup = (() => void) | undefined

/**
 * Register for push notifications on native platforms.
 *
 * @param userId - The authenticated user's ID (skip registration if undefined)
 * @returns { requestPermission, isSupported }
 */
export function usePushNotifications(userId: string | undefined) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API types generated after `npx convex dev`
  const registerToken = useMutation((api as any).notifications.registerToken)
  const cleanupRef = useRef<PushListenerCleanup>(undefined)

  const isSupported = isNative()

  const requestPermission = useCallback(async () => {
    if (!isSupported || !userId) return false

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')

      // Check current permission status
      const permStatus = await PushNotifications.checkPermissions()

      if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
        const result = await PushNotifications.requestPermissions()
        if (result.receive !== 'granted') return false
      } else if (permStatus.receive !== 'granted') {
        return false
      }

      // Register with APNs / FCM
      await PushNotifications.register()
      return true
    } catch (error) {
      console.error('[Push] Permission request failed:', error)
      return false
    }
  }, [isSupported, userId])

  // Setup listeners when userId changes
  useEffect(() => {
    if (!isSupported || !userId) return

    let cancelled = false

    const setupListeners = async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications')

        // Listen for successful registration
        const regListener = await PushNotifications.addListener('registration', async (token) => {
          if (cancelled) return
          const platform = isIOS() ? 'ios' as const : 'android' as const
          try {
            await registerToken({
              userId,
              token: token.value,
              platform,
            })
            console.log('[Push] Token registered:', token.value.substring(0, 20) + '...')
          } catch (err) {
            console.error('[Push] Failed to store token:', err)
          }
        })

        // Listen for registration errors
        const errListener = await PushNotifications.addListener('registrationError', (err) => {
          console.error('[Push] Registration error:', err)
        })

        // Listen for received notifications (foreground)
        const recvListener = await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {
            console.log('[Push] Foreground notification:', notification.title)
            // Could show an in-app toast here
          }
        )

        // Listen for notification taps
        const actionListener = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action) => {
            console.log('[Push] Notification tapped:', action.notification.data)
            // Could navigate to relevant page based on action.notification.data
          }
        )

        cleanupRef.current = () => {
          regListener.remove()
          errListener.remove()
          recvListener.remove()
          actionListener.remove()
        }
      } catch (error) {
        console.error('[Push] Listener setup failed:', error)
      }
    }

    setupListeners()

    return () => {
      cancelled = true
      cleanupRef.current?.()
      cleanupRef.current = undefined
    }
  }, [isSupported, userId, registerToken])

  return { requestPermission, isSupported }
}
