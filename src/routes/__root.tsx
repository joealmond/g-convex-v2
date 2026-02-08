import { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, ClientOnly, useRouteContext } from '@tanstack/react-router'
import { Outlet, HeadContent, Scripts } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ImpersonateProvider } from '@/hooks/use-impersonate'
import { AdminToolbar } from '@/components/AdminToolbar'
import { VoteMigrationHandler } from '@/components/VoteMigrationHandler'
import { authClient } from '@/lib/auth-client'
import { getToken } from '@/lib/auth-server'
import type { ConvexQueryClient } from '@convex-dev/react-query'
import { Toaster } from 'sonner'

import '../styles/globals.css'

// Get auth information for SSR using available cookies
const getAuth = createServerFn({ method: 'GET' }).handler(async () => {
  return await getToken()
})

// Root route context type
interface RouterContext {
  queryClient: QueryClient
  convexQueryClient: ConvexQueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'G-Matrix - Gluten-Free Product Ratings' },
      { name: 'description', content: 'Community-driven ratings for gluten-free products' },
    ],
    links: [{ rel: 'icon', href: '/favicon.ico' }],
  }),
  beforeLoad: async (ctx) => {
    const token = await getAuth()

    // All queries, mutations and actions through TanStack Query will be
    // authenticated during SSR if we have a valid token
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)
    }

    return {
      isAuthenticated: !!token,
      token,
    }
  },
  component: RootComponent,
})

function RootComponent() {
  const context = useRouteContext({ from: Route.id })

  return (
    <ConvexBetterAuthProvider
      client={context.convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={context.token}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <HeadContent />
        </head>
        <body className="min-h-screen bg-background antialiased">
          <ImpersonateProvider>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
            <AdminToolbar />
            {/* Vote migration runs client-side only */}
            <ClientOnly fallback={null}>
              <VoteMigrationHandler />
            </ClientOnly>
          </ImpersonateProvider>
          <Toaster richColors position="bottom-right" />
          <Scripts />
        </body>
      </html>
    </ConvexBetterAuthProvider>
  )
}
