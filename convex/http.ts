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
// OAuth Bridge: Native Cookie Injection + Web OTT (One-Time Token)
// =============================================================================
// Better Auth's OAuth callback throws an APIError (302) to redirect.
// This bypasses all after-hooks in the Convex runtime, so plugins like
// `capacitor` and `crossDomain` can't post-process the response.
//
// Fix: Wrap auth.handler() at the HTTP layer and post-process 302 redirects:
//
// 1. Native deep links (gmatrix://): inject set-cookie as ?cookie= param
//    (for better-auth-capacitor to pick up the session)
//
// 2. Web redirects (http/https): extract session token from set-cookie,
//    generate a one-time token (OTT), store it in the verification table,
//    and append ?ott=TOKEN to the URL. ConvexBetterAuthProvider on the
//    client verifies the OTT and establishes the session.
// =============================================================================

/**
 * Generate a cryptographically random string (alphanumeric)
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => chars[byte % chars.length]).join('')
}

/**
 * Extract the raw session token from a set-cookie header string.
 * Cookie format: `__Secure-better-auth.session_token=TOKEN.SIGNATURE; ...`
 * The DB stores just TOKEN, so we split on '.' and return the first part.
 */
function extractSessionToken(setCookie: string): string | null {
  // Match: ...session_token=VALUE; or ...session_token=VALUE (end of string)
  const match = setCookie.match(/session_token=([^;]+)/)
  if (!match) return null
  const cookieValue = decodeURIComponent(match?.[1] ?? '')
  // Cookie value is "token.signature" — we only need the token part
  const dotIndex = cookieValue.indexOf('.')
  return dotIndex > 0 ? cookieValue.substring(0, dotIndex) : cookieValue
}

const createAuthWithBridge = (ctx: GenericCtx<DataModel>) => {
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

            // --- Native deep links (non-HTTP schemes like gmatrix://) ---
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
              if (!url.searchParams.has('cookie')) {
                url.searchParams.set('cookie', setCookie)
                const newHeaders = new Headers(response.headers)
                newHeaders.set('location', url.toString())
                return new Response(null, { status: 302, headers: newHeaders })
              }
              return response
            }

            // --- Web redirects (HTTP/HTTPS) ---
            // Extract session token and generate OTT for cross-domain auth
            const sessionToken = extractSessionToken(setCookie)
            if (!sessionToken) return response

            // Don't double-inject
            if (url.searchParams.has('ott')) return response

            // Generate OTT and store in verification table
            const ott = generateRandomString(32)
            const expiresAt = new Date(Date.now() + 3 * 60 * 1000) // 3 minutes

            const authContext = await auth.$context
            await authContext.internalAdapter.createVerificationValue({
              value: sessionToken,
              identifier: `one-time-token:${ott}`,
              expiresAt,
            })

            url.searchParams.set('ott', ott)
            const newHeaders = new Headers(response.headers)
            newHeaders.set('location', url.toString())

            console.log('[OAuth Bridge] OTT generated for web redirect:', url.origin)

            return new Response(null, { status: 302, headers: newHeaders })
          } catch (e) {
            console.error('[OAuth Bridge] Error processing redirect:', e)
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
authComponent.registerRoutes(http, createAuthWithBridge, {
  cors: {
    // Headers sent by better-auth-capacitor client plugin + cross-domain plugin
    allowedHeaders: ['capacitor-origin', 'x-skip-oauth-proxy', 'better-auth-cookie'],
    // Headers the capacitor/cross-domain client reads from responses
    exposedHeaders: ['set-auth-token', 'set-better-auth-cookie'],
  },
})

export default http

