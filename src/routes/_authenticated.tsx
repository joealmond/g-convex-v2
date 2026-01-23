import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

/**
 * Authenticated Layout Route
 * 
 * This layout route protects all child routes under /_authenticated/
 * Any route like /_authenticated/dashboard.tsx will require authentication.
 * 
 * Usage:
 * 1. Create routes under src/routes/_authenticated/ folder
 * 2. They will automatically be protected by this layout
 * 
 * Example: src/routes/_authenticated/dashboard.tsx
 */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    // Check auth from cookie - Better Auth sets a session cookie
    // This runs on both server and client
    const isAuthenticated = typeof window !== 'undefined'
      && document.cookie.includes('better-auth')

    if (!isAuthenticated) {
      // Redirect to login page (or home if no login page exists)
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}
