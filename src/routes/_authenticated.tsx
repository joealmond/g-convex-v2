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
  beforeLoad: async ({ context }) => {
    // Uses SSR-resolved auth state from __root.tsx beforeLoad
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}
