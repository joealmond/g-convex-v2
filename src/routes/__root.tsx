import { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, ClientOnly, useRouteContext } from '@tanstack/react-router'
import { Outlet, HeadContent, Scripts } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ImpersonateProvider } from '@/hooks/use-impersonate'
import { AdminToolbar } from '@/components/AdminToolbar'
import { VoteMigrationHandler } from '@/components/VoteMigrationHandler'
import { OfflineBanner } from '@/components/OfflineBanner'
import { SyncManager } from '@/components/SyncManager'
import { PendingSyncBadge } from '@/components/PendingSyncBadge'
import { PushNotificationManager } from '@/components/PushNotificationManager'
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
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'theme-color', content: '#7CB342' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'manifest', href: '/manifest.json' },
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
        <body className="min-h-screen bg-background antialiased">
          <ImpersonateProvider>
            <OfflineBanner />
            <TopBar />
            <ErrorBoundary>
              <PageShell>
                <Outlet />
              </PageShell>
            </ErrorBoundary>
            <BottomTabs />
            <AdminToolbar />
            {/* Vote migration runs client-side only */}
            <ClientOnly fallback={null}>
              <VoteMigrationHandler />
              <SyncManager />
              <PendingSyncBadge />
              <PushNotificationManager />
            </ClientOnly>
          </ImpersonateProvider>
          <Toaster richColors position="bottom-center" offset="14rem" toastOptions={{ style: { zIndex: 9999 } }} />
          <Scripts />
        </body>
      </html>
    </ConvexBetterAuthProvider>
  )
}
