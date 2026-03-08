import { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, ClientOnly, useRouteContext } from '@tanstack/react-router'
import { Outlet, HeadContent, Scripts } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { lazy, Suspense } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ImpersonateProvider } from '@/hooks/use-impersonate'
import { TopBar } from '@/components/layout/TopBar'
import { BottomTabs } from '@/components/layout/BottomTabs'
import { PageShell } from '@/components/layout/PageShell'
import { authClient } from '@/lib/auth-client'
import { getToken } from '@/lib/auth-server'
import { appConfig } from '@/lib/app-config'
import type { ConvexQueryClient } from '@convex-dev/react-query'
import { Toaster } from 'sonner'
import { useServiceWorker } from '@/hooks/use-online-status'
import { useLocale } from '@/lib/i18n'

import '../styles/globals.css'

const LazyAdminToolbar = lazy(() =>
  import('@/components/AdminToolbar').then((module) => ({ default: module.AdminToolbar }))
)
const LazyVoteMigrationHandler = lazy(() =>
  import('@/components/VoteMigrationHandler').then((module) => ({ default: module.VoteMigrationHandler }))
)
const LazyOfflineBanner = lazy(() =>
  import('@/components/OfflineBanner').then((module) => ({ default: module.OfflineBanner }))
)
const LazySyncManager = lazy(() =>
  import('@/components/SyncManager').then((module) => ({ default: module.SyncManager }))
)
const LazyPendingSyncBadge = lazy(() =>
  import('@/components/PendingSyncBadge').then((module) => ({ default: module.PendingSyncBadge }))
)
const LazyPushNotificationManager = lazy(() =>
  import('@/components/PushNotificationManager').then((module) => ({ default: module.PushNotificationManager }))
)

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
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
      { title: `${appConfig.appName} - ${appConfig.tagline}` },
      { name: 'description', content: `Community-driven ratings for ${appConfig.categoryTerm}` },
      /* PWA Meta Tags */
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'theme-color', content: '#7CB342' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'manifest', href: '/api/manifest/json' },
      /* Inter Font from Google Fonts */
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
    ],
    scripts: [
      {
        children: `
          (function() {
            try {
              const theme = localStorage.getItem('theme') || 'system';
              const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              const resolved = theme === 'system' 
                ? (systemPrefersDark ? 'dark' : 'light')
                : theme === 'dark' 
                  ? 'dark' 
                  : 'light';
              if (resolved === 'dark') {
                document.documentElement.classList.add('dark');
              }
            } catch (e) {}
          })();
        `,
      },
    ],
  }),
  beforeLoad: async (ctx) => {
    // In SSR mode (Cloudflare), getAuth() fetches the token server-side for pre-authenticated rendering.
    // In SPA mode (Capacitor), there's no server — getAuth() will fail, so we gracefully
    // fall back to null. Client-side auth via ConvexBetterAuthProvider takes over instead.
    let token: string | null = null
    try {
      token = (await getAuth()) ?? null
    } catch {
      // Expected in SPA/Capacitor mode — no server to handle the server function
    }

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
  const locale = useLocale()

  // Register service worker for offline caching (client-side only)
  useServiceWorker()

  return (
    <ConvexBetterAuthProvider
      client={context.convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={context.token}
    >
      <html lang={locale} suppressHydrationWarning>
        <head>
          <HeadContent />
        </head>
        <body className="min-[100dvh] bg-background antialiased">
          <ImpersonateProvider>
            <Suspense fallback={null}>
              <LazyOfflineBanner />
            </Suspense>
            <TopBar />
            <ErrorBoundary>
              <PageShell>
                <Outlet />
              </PageShell>
            </ErrorBoundary>
            <BottomTabs />
            <Suspense fallback={null}>
              <LazyAdminToolbar />
            </Suspense>
            {/* Vote migration runs client-side only */}
            <ClientOnly fallback={null}>
              <Suspense fallback={null}>
                <LazyVoteMigrationHandler />
                <LazySyncManager />
                <LazyPendingSyncBadge />
                <LazyPushNotificationManager />
              </Suspense>
            </ClientOnly>
          </ImpersonateProvider>
          <Toaster richColors position="bottom-center" offset="14rem" toastOptions={{ style: { zIndex: 9999 } }} />
          <Scripts />
        </body>
      </html>
    </ConvexBetterAuthProvider>
  )
}
