import { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, ClientOnly } from '@tanstack/react-router'
import { Outlet, HeadContent, Scripts } from '@tanstack/react-router'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ImpersonateProvider } from '@/hooks/use-impersonate'
import { AdminToolbar } from '@/components/AdminToolbar'
import { VoteMigrationHandler } from '@/components/VoteMigrationHandler'

import '../styles/globals.css'

// Root route context type
interface RouterContext {
  queryClient: QueryClient
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
  component: RootComponent,
})

function RootComponent() {
  return (
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
        <Scripts />
      </body>
    </html>
  )
}
