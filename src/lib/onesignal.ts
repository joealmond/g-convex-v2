/**
 * OneSignal Push Notification SDK Integration
 *
 * Initializes OneSignal on native platforms (iOS/Android via Capacitor).
 * Links device to authenticated user via external_id for targeted push delivery.
 *
 * @see https://documentation.onesignal.com/docs/cordova-sdk-setup
 * @see https://github.com/nicefiction/onesignal-cordova-plugin
 *
 * ⚠️  SETUP REQUIRED:
 * - Set VITE_ONESIGNAL_APP_ID in .env (client-side initialization)
 * - Set ONESIGNAL_APP_ID + ONESIGNAL_REST_API_KEY in Convex env vars (server-side delivery)
 * - Configure iOS APNs certificate and Android FCM key in OneSignal dashboard
 *
 * See docs/PUSH_NOTIFICATIONS_SETUP.md for full configuration.
 */
import { isNative } from '@/lib/platform'

let initialized = false

/**
 * Initialize the OneSignal SDK. Call once at app startup (client-side, native only).
 * On web, this is a no-op.
 */
export async function initOneSignal(): Promise<void> {
  if (!isNative() || initialized) return

  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID
  if (!appId) {
    console.warn('[OneSignal] VITE_ONESIGNAL_APP_ID not set, skipping initialization')
    return
  }

  try {
    const { default: OneSignal } = await import('onesignal-cordova-plugin')

    OneSignal.initialize(appId)

    // Log push subscription changes in dev
    if (import.meta.env.DEV) {
      OneSignal.Debug.setLogLevel(6) // VERBOSE in dev
    }

    initialized = true
    console.log('[OneSignal] Initialized with app ID:', appId.substring(0, 8) + '...')
  } catch (error) {
    console.error('[OneSignal] Initialization failed:', error)
  }
}

/**
 * Login the user to OneSignal. This links the device to the user via external_id,
 * enabling targeted push delivery from Convex actions via REST API.
 *
 * Call this after the user authenticates (Better Auth session established).
 *
 * @param userId - The Better Auth user._id (string UUID)
 */
export async function oneSignalLogin(userId: string): Promise<void> {
  if (!isNative() || !initialized) return

  try {
    const { default: OneSignal } = await import('onesignal-cordova-plugin')
    OneSignal.login(userId)
    console.log('[OneSignal] Logged in user:', userId.substring(0, 8) + '...')
  } catch (error) {
    console.error('[OneSignal] Login failed:', error)
  }
}

/**
 * Logout from OneSignal. Dissociates the device from the current user.
 * Call on sign-out.
 */
export async function oneSignalLogout(): Promise<void> {
  if (!isNative() || !initialized) return

  try {
    const { default: OneSignal } = await import('onesignal-cordova-plugin')
    OneSignal.logout()
    console.log('[OneSignal] Logged out')
  } catch (error) {
    console.error('[OneSignal] Logout failed:', error)
  }
}

/**
 * Request push notification permission from the user.
 * Returns true if permission was granted.
 *
 * On iOS, this shows the native permission dialog.
 * On Android 13+, this shows the runtime permission dialog.
 *
 * @param fallbackToSettings - If true and permission was previously denied,
 *   prompts user to open device settings. Default: false.
 */
export async function requestPushPermission(fallbackToSettings = false): Promise<boolean> {
  if (!isNative() || !initialized) return false

  try {
    const { default: OneSignal } = await import('onesignal-cordova-plugin')
    const granted = await OneSignal.Notifications.requestPermission(fallbackToSettings)
    console.log('[OneSignal] Permission:', granted ? 'granted' : 'denied')
    return granted
  } catch (error) {
    console.error('[OneSignal] Permission request failed:', error)
    return false
  }
}

/**
 * Check if push notification permission has been granted.
 */
export async function hasPushPermission(): Promise<boolean> {
  if (!isNative() || !initialized) return false

  try {
    const { default: OneSignal } = await import('onesignal-cordova-plugin')
    return await OneSignal.Notifications.getPermissionAsync()
  } catch {
    return false
  }
}

/**
 * Add a notification click listener.
 * Useful for deep-linking when user taps a notification.
 *
 * @param handler - Callback receiving the notification click event
 * @returns cleanup function to remove the listener
 */
export async function onNotificationClick(
  handler: (notification: { title?: string; body?: string; data?: Record<string, unknown> }) => void
): Promise<() => void> {
  if (!isNative() || !initialized) return () => {}

  const { default: OneSignal } = await import('onesignal-cordova-plugin')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- OneSignal NotificationClickEvent type uses `object` for additionalData
  const listener = (event: any) => {
    handler({
      title: event.notification?.title,
      body: event.notification?.body,
      data: event.notification?.additionalData,
    })
  }

  OneSignal.Notifications.addEventListener('click', listener)
  return () => OneSignal.Notifications.removeEventListener('click', listener)
}
