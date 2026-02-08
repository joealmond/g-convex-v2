import { createAuthClient } from 'better-auth/react'
import { convexClient } from '@convex-dev/better-auth/client/plugins'

export const authClient = createAuthClient({
  // NO baseURL - requests go to /api/auth/* which is proxied to Convex
  plugins: [convexClient()],
})

// Export commonly used hooks and utilities
export const {
  signIn,
  signOut,
  useSession,
} = authClient
