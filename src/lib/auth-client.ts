import { createAuthClient } from 'better-auth/react'
import { convexClient } from '@convex-dev/better-auth/client/plugins'
import { isNative } from './platform'

// In native Capacitor mode, auth requests must go directly to the Convex backend
// (there is no local server in a Capacitor WebView)
// In web mode, use relative origin (SSR proxies to Convex)
const baseURL = typeof window !== 'undefined' && isNative()
  ? import.meta.env.VITE_CONVEX_SITE_URL
  : undefined

export const authClient = createAuthClient({
  baseURL,
  plugins: [convexClient()],
})

// Export commonly used hooks and utilities
export const {
  signIn,
  signOut,
  useSession,
} = authClient
