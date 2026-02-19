/**
 * PushNotificationManager
 *
 * Invisible component that initializes OneSignal push notifications
 * and links the device to the authenticated user. Must be rendered
 * inside ConvexBetterAuthProvider so useSession() is available.
 *
 * Renders nothing — purely side-effect driven.
 */
import { useSession } from '@/lib/auth-client'
import { usePushNotifications } from '@/hooks/use-push-notifications'

export function PushNotificationManager() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  // Hook handles init, login/logout, and click listeners
  usePushNotifications(userId)

  return null
}
