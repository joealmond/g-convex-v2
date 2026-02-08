# Template Improvements from G-Matrix v2

Improvements and patterns developed while building the G-Matrix v2 application using the `convex-tanstack-cloudflare` template. These changes should be considered for upstream contribution.

---

## 1. Auth Server Fallback for `VITE_CONVEX_SITE_URL`

**File**: `src/lib/auth-server.ts`

The template requires both `VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL`. In practice, the site URL is always the cloud URL with `.cloud` replaced by `.site`. Added a fallback:

```typescript
convexSiteUrl: env.VITE_CONVEX_SITE_URL ?? env.VITE_CONVEX_URL.replace('.cloud', '.site'),
```

**Benefit**: Reduces required env vars from 2 to 1 for most users.

---

## 2. Environment Validation with Zod

**File**: `src/lib/env.ts`

Added a Zod-based environment validator that:
- Validates `VITE_CONVEX_URL` is a valid URL
- Makes `VITE_CONVEX_SITE_URL` optional (with fallback above)
- Provides clear error messages on missing vars during startup

**Recommendation**: Template should include `env.ts` or similar validation out of the box.

---

## 3. Image Storage Pattern (imageStorageId)

**Files**: `convex/schema.ts`, `convex/products.ts`, `convex/votes.ts`

Established a pattern for Convex file storage:
- Store `imageStorageId: Id<'_storage'>` on the document
- Resolve the URL at query time via `ctx.storage.getUrl()`  
- Keep `imageUrl` as fallback for external URLs
- Upload flow: `generateUploadUrl` → upload file → store `storageId` → resolve on read

This is a common pattern that the template could document in `docs/FILE_UPLOADS.md`.

---

## 4. Glass Morphism CSS Utilities

**File**: `src/styles/globals.css`

Added reusable glass effect utilities:
```css
.glass { @apply bg-background/60 backdrop-blur-lg border-white/10 shadow-xl; }
.glass-card { @apply bg-card/40 backdrop-blur-md border-white/10 shadow-lg hover:bg-card/50 transition-colors; }
.glass-panel { @apply bg-background/80 backdrop-blur-xl border-border/50 shadow-2xl; }
```

Applied to `Card`, `Dialog`, and `AlertDialog` components for a modern frosted-glass look.

---

## 5. SSR Auth in `_authenticated.tsx`

**File**: `src/routes/_authenticated.tsx`

The original implementation used a client-side cookie check that doesn't work during SSR:
```typescript
// ❌ Broken - window/document not available during SSR
const isAuthenticated = typeof window !== 'undefined' && document.cookie.includes('better-auth')
```

Fixed to use the SSR-resolved context from `__root.tsx`:
```typescript
// ✅ Works in SSR and CSR
beforeLoad: async ({ context }) => {
  if (!context.isAuthenticated) {
    throw redirect({ to: '/login' })
  }
}
```

**Recommendation**: Template should include this fix and document the pattern.

---

## 6. API Auth Route vs server.ts Handler

**File**: `src/routes/api/auth/$.ts`

The template pattern of using `createAPIFileRoute` for auth is cleaner than manually intercepting requests in `server.ts`. This keeps `server.ts` clean and framework-native:

```typescript
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { handler } from '@/lib/auth-server'

export const APIRoute = createAPIFileRoute('/api/auth/$')({
  GET: ({ request }) => handler(request),
  POST: ({ request }) => handler(request),
})
```

---

## 7. Sonner Toaster in Root

**File**: `src/routes/__root.tsx`

The template should include `<Toaster />` from `sonner` in the root component since toast notifications are used by many common patterns (CRUD, auth errors, etc.):

```tsx
import { Toaster } from 'sonner'
// In RootComponent body:
<Toaster richColors position="bottom-right" />
```

---

## 8. `@tanstack/react-router-with-query` Not Needed

The `@tanstack/react-router-with-query` package is superseded by `@tanstack/react-router-ssr-query` in newer TanStack versions. The template and projects should not include both.

---

## 9. Auto-Admin for First User

**File**: `convex/users.ts`

Added auto-admin logic for initial setup: the first user to register gets admin privileges. This eliminates the chicken-and-egg problem of "how do I make myself admin without an admin panel."

```typescript
// Check if this is the first user (auto-admin for initial setup)
const allProfiles = await ctx.db.query('profiles').collect()
if (allProfiles.length <= 1) {
  return true
}
```

---

## 10. AI Image Analysis (Gemini)

**File**: `convex/ai.ts`

Implemented direct Gemini API integration without SDK dependency:
- Uses `btoa()` for base64 encoding (V8 compatible, no `Buffer`)
- Calls `gemini-2.0-flash` API directly via `fetch()`
- Returns structured product analysis (name, safety/taste scores, tags, gluten warnings)

**Note**: Uses web-standard `btoa()` instead of `Buffer.from().toString('base64')` which is not available in Convex's V8 runtime.

---

## Summary of Changes Applied

| Change | Type | Status |
| ------ | ---- | ------ |
| Remove duplicate JSDoc in products.ts | Cleanup | ✅ Done |
| Reset config.ts admin emails to placeholder | Cleanup | ✅ Done |
| Fix `_authenticated.tsx` SSR auth check | Bug fix | ✅ Done |
| Remove hardcoded Convex URL from vite.config.ts | Security/Cleanup | ✅ Done |
| Add Toaster to __root.tsx | Missing feature | ✅ Done |
| Remove unused `react-router-with-query` dep | Cleanup | ✅ Done |
| Add API auth route (`/api/auth/$`) | Best practice | ✅ Done |
| Simplify server.ts (remove manual auth handler) | Cleanup | ✅ Done |
| Update AUTH_SOLUTION.md to match code | Docs | ✅ Done |
| Remove `expectAuth: true` | Bug fix | ✅ Done |

---

## Lessons Learned (Critical — Recent Debugging)

### 11. `expectAuth: true` Blocks Anonymous Users Completely

**File**: `src/router.tsx`

Setting `expectAuth: true` on `ConvexQueryClient` causes **all** queries to wait for auth to resolve before executing. If the user is unauthenticated (anonymous), queries never fire — breaking public features like product browsing and anonymous voting.

```typescript
// ❌ Blocks anonymous users — all queries wait for auth
const convexQueryClient = new ConvexQueryClient(convexClient, {
  expectAuth: true,
})

// ✅ Works for hybrid apps with both public and authenticated features
const convexQueryClient = new ConvexQueryClient(convexClient)
```

**When to use `expectAuth: true`:**
- Admin panels where every page requires login
- Internal tools with no public routes
- Apps where unauthenticated access should show nothing

**When NOT to use it:**
- Public product listings, blogs, or marketing sites
- Apps with anonymous features (voting, commenting)
- Hybrid apps where some routes are public and others are protected

**Recommendation for template**: Document this clearly. The current `@convex-dev/react-query` docs don't explain the anonymous user impact.

---

### 12. Cloudflare Workers Rejects Dynamic `import.meta.env` Access

**File**: `src/lib/env.ts`

Cloudflare Workers' build pipeline statically analyzes `import.meta.env` references. Casting `import.meta` to `any` and then accessing `.env` dynamically breaks with:

```
Dynamic access of import.meta.env is not supported
```

```typescript
// ❌ Breaks in Cloudflare Workers
const url = (import.meta as any).env.VITE_CONVEX_URL

// ✅ Works everywhere — direct property access
const url = import.meta.env.VITE_CONVEX_URL
```

**Already fixed**: Our `env.ts` uses direct property access. But the template and reference projects should be audited for this pattern.

---

### 13. Rate Limiting for Anonymous vs Authenticated Users

**File**: `convex/votes.ts`

The current rate limiter uses a flat rate for all users. For hybrid apps with anonymous features, rate limits should differentiate by authentication status:

```typescript
// Current: flat rate for all
const rateLimiter = new RateLimiter(components.rateLimiter, {
  vote: { kind: 'token bucket', rate: 10, period: 60000, capacity: 15 },
})

// Recommended: role-aware rate limiting
// Apply stricter limits to anonymous users (e.g. 50% of authenticated rate)
// by checking isAnonymous and adjusting the key or bucket accordingly
```

**Recommendation for template**: Add a "rate limiting with anonymous users" example showing how to apply different thresholds based on auth status.

---

### 14. Auth Pattern Inconsistency: `ctx.auth` vs `authComponent`

**Files**: `convex/files.ts`, `convex/products.ts`, `convex/votes.ts` vs `convex/users.ts`, `convex/auth.ts`

Two different auth patterns coexist in the codebase:

```typescript
// Pattern A: Convex built-in (used in files.ts, products.ts, votes.ts, profiles.ts)
const identity = await ctx.auth.getUserIdentity()

// Pattern B: Better Auth component (used in users.ts, auth.ts, authHelpers.ts)
const user = await authComponent.getAuthUser(ctx)
```

Both work for checking "is the user logged in?", but they return different shapes:
- `ctx.auth.getUserIdentity()` → returns JWT claims (`subject`, `email`, etc.)
- `authComponent.getAuthUser()` → returns the full Better Auth user record

**Recommendation for template**: Pick one pattern and use it consistently. If using Better Auth, prefer `authComponent.getAuthUser()` everywhere, with a safe wrapper like `getAuthUserSafe()` for queries that should work for anonymous users.

---

## Feedback for Template Team (convex-tanstack-cloudflare)

### Quick Wins for Docs

1. **Add a "Public + Auth hybrid app" example** — Most real apps have public routes
2. **Document `expectAuth: true` vs omitting it** — The anonymous user impact is non-obvious
3. **Add Cloudflare Workers gotchas section** — Dynamic `import.meta.env`, `Buffer` unavailability, etc.
4. **Add rate limiting with anonymous users example** — Common need for community apps
5. **Standardize auth pattern** — Choose `ctx.auth` or `authComponent` and document why

### Things That Were Helpful

- The `ConvexBetterAuthProvider` + `initialToken` SSR pattern (once working) is excellent
- `createAPIFileRoute` for auth proxy is the right approach
- The `ConvexQueryClient` + TanStack Query integration is clean
- `@tanstack/react-router-ssr-query` simplifies SSR hydration significantly
