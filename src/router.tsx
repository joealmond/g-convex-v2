import { createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { routeTree } from './routeTree.gen'
import { env } from './lib/env'
import { Suspense, type ReactNode } from 'react'
import { NotFound } from './components/NotFound'

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

export function getRouter() {
  const convexClient = new ConvexReactClient(env.VITE_CONVEX_URL)
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
    mutationCache: new MutationCache({
      onError: (error) => {
        console.error('Mutation error:', error)
      },
    }),
  })
  convexQueryClient.connect(queryClient)

  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    context: { queryClient },
    scrollRestoration: true,
    defaultPendingComponent: RouteLoadingFallback,
    defaultNotFoundComponent: NotFound,
    Wrap: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <ConvexProvider client={convexClient}>
          <Suspense fallback={<RouteLoadingFallback />}>
            {children}
          </Suspense>
        </ConvexProvider>
      </QueryClientProvider>
    ),
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
