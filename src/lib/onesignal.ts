/**
 * OneSignal Push Notification SDK — STUB
 *
 * ⚠️  DEPRECATED (Feb 2026): `onesignal-cordova-plugin` has been REMOVED from the project
 * because it is not compatible with Capacitor 8's Swift Package Manager (SPM).
 * The plugin has no Package.swift, causing Xcode build failures on iOS.
 *
 * All functions in this file are no-ops. Replace with a compatible push SDK when needed:
 * - @capacitor-firebase/messaging (recommended, SPM ✅)
 * - @capacitor/push-notifications (official Capacitor, SPM ✅)
 *
 * Server-side delivery (convex/actions/sendPush.ts) is independent and still works
 * with the OneSignal REST API if a compatible client SDK is re-added.
 *
 * See docs/PUSH_NOTIFICATIONS_SETUP.md for details and migration options.
 */

/** Initialize push notifications. Currently a no-op — SDK removed. */
export async function initOneSignal(): Promise<void> {}

/** Login user for targeted push. Currently a no-op — SDK removed. */
export async function oneSignalLogin(_userId: string): Promise<void> {}

/** Logout from push service. Currently a no-op — SDK removed. */
export async function oneSignalLogout(): Promise<void> {}

/** Request push permission. Currently returns false — SDK removed. */
export async function requestPushPermission(_fallbackToSettings = false): Promise<boolean> {
  return false
}

/** Check push permission. Currently returns false — SDK removed. */
export async function hasPushPermission(): Promise<boolean> {
  return false
}

/** Add notification click listener. Currently returns empty cleanup — SDK removed. */
export async function onNotificationClick(
  _handler: (notification: { title?: string; body?: string; data?: Record<string, unknown> }) => void
): Promise<() => void> {
  return () => {}
}
