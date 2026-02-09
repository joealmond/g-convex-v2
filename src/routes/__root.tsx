import { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, ClientOnly, useRouteContext } from '@tanstack/react-router'
import { Outlet, HeadContent, Scripts } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ImpersonateProvider } from '@/hooks/use-impersonate'
import { AdminToolbar } from '@/components/AdminToolbar'
import { VoteMigrationHandler } from '@/components/VoteMigrationHandler'
import { TopBar } from '@/components/layout/TopBar'
import { BottomTabs } from '@/components/layout/BottomTabs'
import { PageShell } from '@/components/layout/PageShell'
import { authClient } from '@/lib/auth-client'
import { getToken } from '@/lib/auth-server'
import { appConfig } from '@/lib/app-config'
import { I18nProvider } from '@/hooks/i18n-context'
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
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: `${appConfig.appName} - ${appConfig.tagline}` },
      { name: 'description', content: `Community-driven ratings for ${appConfig.categoryTerm}` },
      /* PWA Meta Tags */
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
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
          <I18nProvider>
          <ImpersonateProvider>
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
            </ClientOnly>
          </ImpersonateProvider>
          </I18nProvider>
          <Toaster richColors position="bottom-center" offset="8rem" toastOptions={{ style: { zIndex: 9999 } }} />
          <Scripts />
        </body>
      </html>
    </ConvexBetterAuthProvider>
  )
}
