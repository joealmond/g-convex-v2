/**
 * User Queries & Mutations
 * ========================
 *
 * This module provides user-related Convex functions for the frontend.
 *
 * ## Available Functions
 *
 * - `users.current` - Get the current authenticated user
 * - `users.isAdmin` - Check if current user is an admin
 *
 * ## Usage
 *
 * ```tsx
 * import { useQuery } from '@tanstack/react-query'
 * import { convexQuery } from '@convex-dev/react-query'
 * import { api } from '@convex/_generated/api'
 *
 * // Check admin status
 * const { data: isAdmin } = useQuery(convexQuery(api.users.isAdmin, {}))
 * ```
 *
 * ## Making a User Admin
 *
 * Option 1: Add their email to ADMIN_EMAILS in convex/lib/config.ts
 * Option 2: Use Better Auth's admin plugin (requires additional setup)
 */

import { query, type QueryCtx } from './_generated/server'
import { authComponent } from './auth'
import { ADMIN_EMAILS, ROLES } from './lib/config'
import { getAuthUser } from './lib/authHelpers'
import { profilesAggregate } from './aggregates'

/**
 * Safely get the authenticated user, returning null if unauthenticated.
 * This prevents throwing during SSR when no session exists.
 */
async function getAuthUserSafe(ctx: QueryCtx): Promise<Awaited<ReturnType<typeof getAuthUser>> | null> {
  try {
    return (await authComponent.getAuthUser(ctx)) as any
  } catch {
    // Unauthenticated - return null instead of throwing
    return null
  }
}

/**
 * Get the current authenticated user.
 *
 * @returns The user object or null if not authenticated
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getAuthUserSafe(ctx)
  },
})

/**
 * Check if the current user is an admin.
 *
 * Admin status is determined by:
 * 1. First registered user (auto-admin for initial setup)
 * 2. Email whitelist (ADMIN_EMAILS in lib/config.ts)
 * 3. Role field on user record (role === 'admin')
 *
 * @returns true if user is an admin, false otherwise
 */
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUserSafe(ctx)
    if (!user) {
      return false
    }

    // Check email whitelist first (for easy setup)
    if (user.email && ADMIN_EMAILS.includes(user.email)) {
      return true
    }

    // Check if this is the first user (auto-admin for initial setup)
    // We use profiles table since it's created for each authenticated user
    // Auto-admin for initial setup
    const profileCount = await profilesAggregate.count(ctx)
    if (profileCount <= 1) {
      // Either no profiles yet (this is the first login) or only one profile exists
      return true
    }

    // Fallback: check role field in database
    return user.role === ROLES.ADMIN
  },
})
