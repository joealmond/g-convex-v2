import * as Sentry from '@sentry/react'
import { createRouter } from '@tanstack/react-router'
import { QueryClient, MutationCache, QueryCache } from '@tanstack/react-query'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { ConvexReactClient } from 'convex/react'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { toast } from 'sonner'
import { routeTree } from './routeTree.gen'
import { env } from './lib/env'
import { NotFound } from './components/NotFound'

import { logger } from './lib/logger'

// Fallback component for lazy-loaded routes
function RouteLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

// Initialize Sentry early so it catches startup errors too
if (typeof window !== 'undefined' && env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    environment: env.VITE_APP_ENV,
    // Enable performance monitoring
    tracesSampleRate: env.VITE_APP_ENV === 'production' ? 0.2 : 1.0,
    // Capture React Router navigations if desired, but base configuration is fine
  })
}

export function getRouter() {
  const convexClient = new ConvexReactClient(env.VITE_CONVEX_URL)
  // Don't use expectAuth: true — it blocks ALL queries until auth resolves,
  // breaking anonymous/public features (product browsing, anonymous voting).
  // Auth is handled via ConvexBetterAuthProvider + SSR token in __root.tsx.
  const convexQueryClient = new ConvexQueryClient(convexClient)

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        // Cache settings
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        logger.error('Global Query Error', error, { queryKey: query.queryKey })
        // Don't show toast for every background refetch error to avoid spam,
        // but log them for debugging
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, variables, _context, mutation) => {
        logger.error('Global Mutation Error', error, { mutationKey: mutation.options.mutationKey, variables })
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
        
        // Only show toast if window is defined (client-side)
        if (typeof window !== 'undefined') {
          toast.error('Action Failed', {
            description: errorMessage
          })
        }
      },
    }),
  })
  convexQueryClient.connect(queryClient)

  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    context: { queryClient, convexQueryClient },
    scrollRestoration: true,
    defaultPendingComponent: RouteLoadingFallback,
    defaultNotFoundComponent: NotFound,
  })
  
  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
