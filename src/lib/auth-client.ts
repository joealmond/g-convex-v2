import { createAuthClient } from 'better-auth/react'
import { convexClient } from '@convex-dev/better-auth/client/plugins'
import { withCapacitor } from 'better-auth-capacitor/client'
import { isNative } from './platform'

// In native Capacitor mode, auth requests must go directly to the Convex backend
// (there is no local server in a Capacitor WebView)
// In web mode, use relative origin (SSR proxies to Convex)
const baseURL = typeof window !== 'undefined' && isNative()
  ? import.meta.env.VITE_CONVEX_SITE_URL
  : undefined

// On native, withCapacitor() wraps the config to:
// 1. Add capacitorClient plugin (session caching, OAuth flow, deep link handling)
// 2. Set disableDefaultFetchPlugins: true (prevents in-WebView redirect; uses system browser)
// On web, we skip the wrapper (standard flow)
const authConfig = isNative()
  ? withCapacitor(
      {
        baseURL,
        plugins: [convexClient()],
      },
      {
        scheme: 'gmatrix',
        storagePrefix: 'better-auth',
      },
    )
  : {
      baseURL,
      plugins: [convexClient()],
    }

export const authClient = createAuthClient(authConfig)

// Export commonly used hooks and utilities
export const {
  signIn,
  signOut,
  useSession,
} = authClient
