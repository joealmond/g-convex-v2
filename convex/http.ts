import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { authComponent, createAuth } from './auth'
import type { GenericCtx } from '@convex-dev/better-auth'
import type { DataModel } from './_generated/dataModel'

const http = httpRouter()

// Health check endpoint for monitoring
http.route({
  path: '/api/health',
  method: 'GET',
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({
        status: 'ok',
        layer: 'convex',
        timestamp: Date.now(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }),
})

// =============================================================================
// Native OAuth Cookie Bridge
// =============================================================================
// The better-auth-capacitor server plugin's after-hook is supposed to read
// `set-cookie` from ctx.context.responseHeaders and append it as a `?cookie=`
// query param on the redirect URL (e.g. gmatrix://auth/callback?cookie=...).
//
// In the Convex runtime, Better Auth's OAuth callback throws an APIError (302)
// to redirect. The plugin's after-hook never executes (the error bypasses it),
// so the cookie is never injected into the redirect URL.
//
// Fix: Wrap auth.handler() at the HTTP layer. After Better Auth produces the
// final Response (which correctly has set-cookie and location headers), we
// post-process 302 redirects to non-HTTP schemes by injecting the set-cookie
// value as a query param. This runs after all internal auth processing.
// =============================================================================

const createAuthWithNativeBridge = (ctx: GenericCtx<DataModel>) => {
  const auth = createAuth(ctx)

  // Use Proxy to preserve all properties (including $context getter used by
  // registerRoutes for CORS trusted origins) while overriding handler.
  return new Proxy(auth, {
    get(target, prop, receiver) {
      if (prop === 'handler') {
        return async (request: Request) => {
          const response = await target.handler(request)

          // Only process 302 redirects
          if (response.status !== 302) return response

          const location = response.headers.get('location')
          const setCookie = response.headers.get('set-cookie')

          if (!location || !setCookie) return response

          try {
            const url = new URL(location)

            // Only inject for non-HTTP schemes (native app deep links)
            if (url.protocol === 'http:' || url.protocol === 'https:') {
              return response
            }

            // Don't double-inject
            if (url.searchParams.has('cookie')) return response

            // Inject set-cookie into the redirect URL
            url.searchParams.set('cookie', setCookie)

            const newHeaders = new Headers(response.headers)
            newHeaders.set('location', url.toString())

            return new Response(null, { status: 302, headers: newHeaders })
          } catch {
            return response
          }
        }
      }
      return Reflect.get(target, prop, receiver)
    },
  })
}

// Register Better Auth routes with CORS support
// Capacitor WebView (capacitor://localhost) makes cross-origin requests
// to the Convex backend, so CORS preflight (OPTIONS) must be handled.
authComponent.registerRoutes(http, createAuthWithNativeBridge, {
  cors: {
    // Headers sent by better-auth-capacitor client plugin
    allowedHeaders: ['capacitor-origin', 'x-skip-oauth-proxy'],
    // Headers the capacitor client reads from responses
    exposedHeaders: ['set-auth-token'],
  },
})

export default http
