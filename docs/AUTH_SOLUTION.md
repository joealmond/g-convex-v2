# 🔐 Auth Integration Solution

## Stack
- **Convex** (^1.31.7) - Backend with real-time data sync
- **Better Auth** (1.4.9) - Authentication library with OAuth providers
- **@convex-dev/better-auth** (^0.10.10) - Convex component for Better Auth
- **TanStack Start** (v1.159.0) - Full-stack React framework with SSR
- **Cloudflare Workers** - Edge deployment

## Problem
CORS errors occurred when auth requests tried to hit `*.convex.site` directly from the client:
```
Access to fetch at 'https://your-deployment.convex.site/better-auth-api/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

## Solution
Follow the **official Convex Better Auth TanStack Start pattern**:

**Reference**: https://labs.convex.dev/better-auth/framework-guides/tanstack-start

### Key Changes

#### 1. Auth Route (`src/routes/api/auth/$.ts`)
Create a catch-all route with server handlers that proxies auth requests to Convex:
```typescript
import { createFileRoute } from '@tanstack/react-router'
import { handler } from '@/lib/auth-server'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => handler(request),
      POST: ({ request }) => handler(request),
    },
  },
})
```

> **Important**: Use `createFileRoute` with `server.handlers`, NOT `createAPIFileRoute`.
> `createAPIFileRoute` requires separate API route discovery config and won't be
> picked up by the standard file-based route generator.

#### 2. Auth Client (`src/lib/auth-client.ts`)
Remove `baseURL` on web — let the proxy handle routing:
```typescript
import { createAuthClient } from 'better-auth/react'
import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins'

export const authClient = createAuthClient({
  // NO baseURL on web - proxy handles routing to /api/auth/*
  plugins: [
    convexClient(),
    crossDomainClient(), // Handles cross-domain session via localStorage + Better-Auth-Cookie header
  ],
})
```

#### 3. Auth Server (`src/lib/auth-server.ts`)
Use `import.meta.env` instead of `process.env` (Cloudflare Workers SSR context):
```typescript
import { convexBetterAuthReactStart } from '@convex-dev/better-auth/react-start'

export const {
  handler,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthReactStart({
  convexUrl: (import.meta as any).env.VITE_CONVEX_URL!,
  convexSiteUrl: (import.meta as any).env.VITE_CONVEX_SITE_URL!,
})
```

#### 4. Router (`src/router.tsx`)
- Do NOT use `expectAuth: true` (blocks anonymous/public queries)
- Use `setupRouterSsrQueryIntegration` for SSR
- Remove `ConvexBetterAuthProvider` from Wrap (moved to root route)
- Pass `convexQueryClient` in context

```typescript
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

// Don't use expectAuth: true — it blocks ALL queries until auth resolves,
// which breaks anonymous/public features.
const convexQueryClient = new ConvexQueryClient(convexUrl)

const router = createRouter({
  routeTree,
  context: { queryClient, convexQueryClient }, // Pass both
  // No Wrap component
})

setupRouterSsrQueryIntegration({ router, queryClient })
```

> **Warning**: `expectAuth: true` should only be used for fully private apps
> (admin panels, internal tools). For apps with public features (anonymous
> voting, product browsing), omit it — auth is handled via
> `ConvexBetterAuthProvider` + SSR token in the root route.

#### 5. Root Route (`src/routes/__root.tsx`)
- Add `ConvexBetterAuthProvider` with `initialToken` from SSR
- Implement `beforeLoad` that calls `getToken()` for SSR auth
- Set auth on `convexQueryClient.serverHttpClient` during SSR

```typescript
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { createServerFn } from '@tanstack/react-start'
import { getToken } from '@/lib/auth-server'

const getAuth = createServerFn({ method: 'GET' }).handler(async () => {
  return await getToken()
})

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  convexQueryClient: ConvexQueryClient
}>()({
  beforeLoad: async (ctx) => {
    const token = await getAuth()
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)
    }
    return { isAuthenticated: !!token, token }
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
      {/* app content */}
    </ConvexBetterAuthProvider>
  )
}
```

## Why This Works

1. **No CORS**: Auth requests go to same origin `/api/auth/*` (no cross-origin)
2. **Server-side proxy**: API route forwards requests to Convex site URL
3. **SSR auth**: Server gets token via `getToken()` and sets it on `convexQueryClient`
4. **Hydration**: `initialToken` passed to client prevents auth flash
5. **Environment variables**: `import.meta.env` works in Cloudflare Workers SSR context (process.env doesn't)

## Cross-Domain OAuth (OTT Flow)

### The Problem
Google OAuth callback goes directly to `convex.site/api/auth/callback/google` —
not through the app's proxy. The session cookie is set on `convex.site`, but the
app runs on `localhost:3000` (or Cloudflare Workers domain). Different domains
mean the cookie is never sent to the proxy, so `getSession()` returns `null`.

### The Solution: One-Time Token (OTT)
Three components work together:

1. **Server plugin** (`convex/auth.ts`): `crossDomain({ siteUrl: process.env.SITE_URL })`
   - Rewrites relative `callbackURL: '/'` to absolute app URL
   - Auto-sets `skipStateCookieCheck: true`

2. **HTTP bridge** (`convex/http.ts`): Post-processes 302 redirects
   - Extracts session token from `set-cookie` (token part before `.`)
   - Generates a random OTT, stores it in the verification table
   - Appends `?ott=TOKEN` to the redirect URL
   - This is necessary because Better Auth's after-hooks DON'T execute
     in the Convex runtime (the 302 is thrown as an `APIError` which
     bypasses them)

3. **Client plugin** (`src/lib/auth-client.ts`): `crossDomainClient()`
   - Stores cookies in `localStorage` (not browser cookies)
   - Sends them via `Better-Auth-Cookie` header
   - `ConvexBetterAuthProvider` checks for `?ott=` on page load, verifies
     it, and establishes the session

### Flow Diagram
```
Client → /api/auth/signin/social (proxy) → Convex → Google
Google → convex.site/api/auth/callback/google (direct, NOT proxy)
Convex → 302 + set-cookie → HTTP bridge adds ?ott=TOKEN
Browser → localhost:3000/?ott=TOKEN
ConvexBetterAuthProvider → POST /api/auth/cross-domain/one-time-token/verify
Session established ✓
```

### Convex Runtime Limitation
Better Auth plugins use `after` hooks to post-process responses. In the Convex
runtime, OAuth callbacks throw `APIError` (status 302) to redirect. This bypasses
all after-hooks. The `convex/http.ts` HTTP bridge intercepts the final Response
and applies the same logic at the HTTP layer.

This affects both:
- **Native**: Cookie injection for Capacitor deep links (`?cookie=` param)
- **Web**: OTT generation for cross-domain auth (`?ott=` param)

## Required Environment Variables

Create `.env.local`:
```bash
# Get these from: npx convex dev
CONVEX_DEPLOYMENT=dev:your-deployment-name
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CONVEX_SITE_URL=https://your-deployment.convex.site

# Your app URL
SITE_URL=http://localhost:3000

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret

# Generate with: npx @better-auth/cli generate-secret
BETTER_AUTH_SECRET=your-generated-secret
```

Set in Convex:
```bash
npx convex env set SITE_URL "http://localhost:3000"
npx convex env set GOOGLE_CLIENT_ID "your-client-id"
npx convex env set GOOGLE_CLIENT_SECRET "GOCSPX-your-secret"
npx convex env set BETTER_AUTH_SECRET "your-generated-secret"
```

## Dependencies
```bash
npm install @tanstack/react-router-ssr-query
```

## References

- **Official Docs**: https://labs.convex.dev/better-auth/framework-guides/tanstack-start
- **Better Auth Docs**: https://www.better-auth.com/docs
- **Convex Better Auth Component**: https://labs.convex.dev/better-auth
- **Reference Projects**: Similar stack implementations for comparison

## Testing

1. Start dev servers:
```bash
npx convex dev  # Terminal 1
npm run dev     # Terminal 2
```

2. Visit `http://localhost:3000`
3. Click "Sign in with Google"
4. Should redirect to Google OAuth consent
5. After consent, should redirect back authenticated
6. No CORS errors in console
7. SSR should work (view page source shows auth state)

## Common Issues

### "CONVEX_SITE_URL is not set"
- Make sure using `import.meta.env` in `auth-server.ts`, not `process.env`
- Verify `.env.local` has `VITE_CONVEX_SITE_URL` set

### Auth not persisting across page reloads
- Check `initialToken` is passed to `ConvexBetterAuthProvider`
- Verify `beforeLoad` is setting auth on `convexQueryClient.serverHttpClient`

### CORS errors persist
- Ensure auth-client.ts has NO `baseURL` property
- Verify API route exists at `src/routes/api/auth/$.ts`
- Check `convexClient()` plugin is registered

### OAuth redirects to `convex.site` instead of app
- Ensure `SITE_URL` is set in Convex env: `npx convex env set SITE_URL "http://localhost:3000"`
- Check `crossDomain({ siteUrl })` plugin is in `convex/auth.ts`
- Verify `callbackURL` in `signIn.social()` is relative (`'/'`), not absolute

### "Session not found" after OAuth
- Check `convex/http.ts` OTT bridge is extracting just the token (before `.`)
- Verify `crossDomainClient()` is in the auth client plugins
- Check Convex logs for `[OAuth Bridge] OTT generated` message

### "Rendered fewer hooks" crash on sign-out
- All React hooks must be called before any early returns in a component
- Move `useMemo`, `useEffect`, `useState` before `if (user === null) return`
- Auth-required queries (`authQuery`) will throw during sign-out transition;
  wrap with error boundary or use `publicQuery` with optional auth

## Convex Logging & Observability

- **Dev**: `npx convex dev` prints all `console.log/warn/error` from Convex functions
- **Dashboard**: Convex Dashboard → Logs tab provides real-time, filterable logs
- **Convex `[ERROR]` on 302**: This is expected — Convex logs all non-2xx HTTP responses as errors, including successful OAuth 302 redirects
- **External logging** (Splunk, Datadog, Axiom): Not built-in. Forward logs via a Convex scheduled action that POSTs to your logging provider's HTTP endpoint
