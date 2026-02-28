# Architecture Overview

> G-Matrix uses a **dual SSR/SPA architecture** to serve both web (Cloudflare Workers) and native (Capacitor iOS/Android) from a single codebase.

---

## Build Pipeline

```
npm run build
  ├── SSR build → dist/server/     → Cloudflare Workers (edge-rendered HTML)
  └── SPA shell → dist/client/     → Capacitor (bundled into native apps)

npx cap sync
  └── copies dist/client/* → ios/App/App/public/ + android/app/src/main/assets/public/
```

## How It Works

### Web (Cloudflare Workers — SSR)

1. TanStack Start runs on Cloudflare Workers as an SSR framework
2. Every request hits the worker, which renders the React tree server-side
3. HTML is streamed to the client with hydration markers
4. On the client, React hydrates and takes over (standard SSR flow)
5. Convex queries are real-time via WebSocket after hydration

### Mobile (Capacitor — SPA)

1. TanStack Start's **SPA Mode** (`spa.enabled: true` in `vite.config.ts`) generates a static `index.html` shell at build time
2. Capacitor bundles `dist/client/` into the native app (WebView)
3. On launch, the WebView loads `index.html` from local assets (no network needed for initial render)
4. The SPA shell bootstraps React, connects to Convex, and handles routing client-side
5. Auth uses `VITE_CONVEX_SITE_URL` as the base URL for Better Auth (since there's no same-origin server)

### Auth Flow Differences

| | Web (SSR) | Mobile (SPA) |
|---|---|---|
| Initial auth | Server-side via `getAuth()` in `__root.tsx` | Client-side via `ConvexBetterAuthProvider` |
| Auth base URL | `undefined` (relative, proxied through SSR server) | `VITE_CONVEX_SITE_URL` (absolute, direct to Convex) |
| Token source | Server fetches token, passes to client via loader | Client fetches token directly |
| `getAuth()` | Returns token | Wrapped in try/catch, gracefully returns `null` |

### SPA Mode Configuration

In `vite.config.ts`:

```ts
tanstackStart({
  spa: {
    enabled: true,
    prerender: {
      outputPath: '/index.html', // Generates dist/client/index.html
    },
  },
})
```

This is TanStack Start's official SPA mode — it generates a static shell alongside the full SSR build. The SSR build is unaffected; the SPA shell is only used by Capacitor.

### Capacitor Schemes

| Platform | Scheme | Origin |
|---|---|---|
| iOS | `capacitor://localhost` | WKWebView cannot use http/https as custom schemes |
| Android | `https://localhost` | Default Capacitor Android scheme |

Both are added to `trustedOrigins` in `convex/auth.ts` to allow auth from native apps.

## Key Files

| File | Role |
|---|---|
| `vite.config.ts` | SPA mode config, Cloudflare plugin, build chunks |
| `capacitor.config.ts` | Capacitor config — webDir points to `dist/client` |
| `src/routes/__root.tsx` | Root layout — `getAuth()` with try/catch for SPA fallback |
| `src/lib/auth-client.ts` | Auth client — routes baseURL based on `isNative()` |
| `src/lib/platform.ts` | Platform detection: `isNative()`, `isIOS()`, `isAndroid()` |
| `convex/auth.ts` | `trustedOrigins` includes Capacitor scheme URLs |
| `wrangler.jsonc` | Cloudflare Workers config |

## Data Flow

```
┌──────────────┐    WebSocket     ┌──────────────┐
│   Browser /  │ ◄──────────────► │   Convex     │
│   WebView    │   (real-time)    │   Cloud      │
└──────────────┘                  └──────────────┘
       │                                 │
       │ HTTP (SSR only)                 │ Scheduled
       ▼                                 │ mutations
┌──────────────┐                         ▼
│  Cloudflare  │                  ┌──────────────┐
│  Workers     │                  │  Cron Jobs   │
│  (SSR)       │                  │  (time-decay,│
└──────────────┘                  │   snapshots) │
                                  └──────────────┘
```

## Why This Architecture?

1. **Single codebase** — Web and mobile share 100% of the React code
2. **SEO + performance** — Web gets SSR via Cloudflare Workers (first meaningful paint < 1s)
3. **Offline-capable shell** — Mobile loads instantly from bundled assets
4. **Real-time everywhere** — Convex WebSocket push works identically on web and mobile
5. **No separate API** — Convex functions serve as both the API and the database layer

## Architecture Edge Cases

### Cloudflare R2 Integration on Capacitor
When uploading to Cloudflare R2, mobile apps on Capacitor face strict CORS blocks because `WKWebView` uses the `capacitor://localhost` scheme.
To solve this, uploads must be proxied through the server. Since Convex runs on Edge computing, the official `@aws-sdk/client-s3` package crashes (`DOMParser is not defined`).
**The Architectural Pattern:**
1. Action generates a presigned URL using `@aws-sdk/s3-request-presigner` (edge-safe).
2. Action decodes base64 payload to binary.
3. Action performs the HTTP `fetch` `PUT` request locally to bypass CORS and Edge SDK limitations.

### Safe Aggregate Deletions
Convex Aggregates (`@convex-dev/aggregate`) are highly scalable but can fall out of sync if records are manually deleted via the dashboard. If the app tries to delete a record that the aggregate already dropped, it throws `DELETE_MISSING_KEY`, crashing the transaction.
**The Architectural Pattern:** Always wrap `aggregate.delete` calls in a utility function (`safeAggregateDelete`) that specifically catches and ignores `DELETE_MISSING_KEY` errors, ensuring the primary DB delete succeeds.
