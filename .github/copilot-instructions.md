# G-Matrix: AI Agent Guidelines

> **Note:** This document describes the **current architecture**. See `docs/planning/ACTION_PLAN.md` for the work backlog.

## What Is This App?

G-Matrix is a **community-driven product rating platform**. Users discover, rate, and locate niche products using a multi-dimensional voting system (2 main axes + price). The current niche is **gluten-free products**, but the codebase is designed to be **reusable for any product niche** (vegan, keto, organic, etc.) by changing a single config file.

**Core user flow**: Discover products in a feed → View product detail → Vote (safety + taste + price + store + GPS) → See where to buy → Earn points and badges.

## Architecture Principles

1. **Niche config, not niche code** — All niche-specific terms (app name, dimension labels like "Safety"/"Taste", quadrant names like "Holy Grail", preset labels, store defaults, colors) live in `src/lib/app-config.ts`. Components read from this config or `useTranslation()`. **Never hardcode niche strings in components.**

2. **Mobile-first** — Design for **320px minimum width** (iPhone SE). Test at 320px, 375px, 390px, and 428px. Bottom tab navigation. Desktop is progressive enhancement. Touch targets ≥ 44px. Test on iOS Safari and Android Chrome.
   - **Under 400px**: Avoid 3-column grids with text content — use horizontal scroll, 2-column, or stacked layouts. Keep card content to icon + number + short label maximum.
   - **Truncation**: Always add `truncate` or `line-clamp-1` on text that might overflow at 320px.
   - **Test viewports**: 320px (iPhone SE), 375px (iPhone 13 mini), 390px (iPhone 14), 428px (iPhone 14 Plus).

3. **Readable by humans** — A mid-level developer should understand any file in under 2 minutes. Prefer explicit code over clever abstractions. No deep nesting. No magic. Name things obviously.

4. **Components under 200 lines** — If a component exceeds 200 lines, extract logic into a custom hook or split into sub-components. One file = one responsibility.

5. **Backend is generic** — Convex functions in `convex/` are niche-agnostic. They operate on two-axis voting (fields named `safety`/`taste` for historical reasons, but the logic is generic threshold-based math). Don't add niche-specific logic to backend functions.

6. **Convex Backend Patterns (New Architecture)**
   - **Auth Middlewares**: Always use `authQuery`, `authMutation`, `adminQuery`, `adminMutation` from `convex/lib/customFunctions.ts`. Do not use RAW `query` / `mutation` unless explicitly public.
   - **Aggregates**: NEVER use `.collect().length` to count records. Use `@convex-dev/aggregate` (`productsAggregate`, `profilesAggregate`, etc.) for highly scalable `O(log n)` stats.
   - **Triggers**: Place background async behaviors (gamification, notifications, AI analysis) in `convex/sideEffects.ts` using `ctx.scheduler.runAfter(0, internal.sideEffects.onX)`. Keep mutations pure + fast.

7. **Config over code** — Swapping niches should require editing `src/lib/app-config.ts` + adding a locale file in `src/locales/`. No component file changes.

8. **SSR-safe** — All routes use TanStack Start SSR. Wrap hook-heavy content in `<Suspense fallback={<Skeleton/>}>`. Never call browser APIs (`window`, `localStorage`, `navigator`) outside `useEffect` or `<ClientOnly>`.
9. **Theme-aware UI** — Dark mode is supported via CSS variables and a `dark` class on `<html>`. Use `useTheme()` for toggles or theme-aware logic, and keep UI colors tied to CSS variables (avoid hardcoded hex in components).

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | TanStack Start + TanStack Router | SSR React framework |
| Backend | Convex | Real-time database + serverless functions |
| Auth | Better Auth via `@convex-dev/better-auth` | Google OAuth, session-based |
| Native Auth | `better-auth-capacitor` | OAuth via system browser + deep links on native |
| Deployment | Cloudflare Workers | Edge SSR for web |
| Native | Capacitor | iOS/Android WebView — loads SPA shell from bundled assets |
| Rendering | SSR (web) + SPA shell (mobile) | TanStack Start SPA Mode generates both from one build |
| UI | shadcn/ui + Tailwind CSS v4 | Component library + utility CSS |
| Charts | Recharts | Scatter plot visualization |
| Maps | Leaflet + react-leaflet + OpenStreetMap | Free, no API key needed |
| Animations | Framer Motion | Micro-interactions and transitions |
| Forms | react-hook-form + Zod | Form state + validation |
| i18n | Custom `useTranslation()` + static JSON locale files | EN + HU, event-driven locale switching |
| Offline | Manual service worker + `idb-keyval` (IndexedDB) | App shell caching + offline action queue |

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/app-config.ts` | Central niche configuration — start here to understand the app's identity |
| `src/lib/types.ts` | TypeScript types, quadrant logic — references app-config for labels |
| `src/lib/platform.ts` | Platform detection: isNative(), isIOS(), isAndroid(), isWeb() |
| `src/lib/auth-client.ts` | Better Auth client — uses `VITE_CONVEX_SITE_URL` as baseURL on native, relative origin on web |
| `capacitor.config.ts` | Capacitor config — webDir, schemes, hostname |
| `convex/schema.ts` | Database schema: products, votes, profiles, files, comments, commentLikes tables |
| `convex/votes.ts` | Vote casting, rate limiting, weighted average recalculation |
| `convex/products.ts` | Product CRUD operations |
| `convex/comments.ts` | Comment CRUD: post, edit, remove (soft-delete), toggleLike, getByProduct, getRecentFeed |
| `convex/community.ts` | Aggregated community activity feed — merges votes, products, comments |
| `convex/lib/gamification.ts` | Points system, badge definitions, streak logic |
| `convex/lib/config.ts` | Admin emails, roles |
| `src/routes/` | One file per screen/page |
| `src/routes/community.tsx` | Community feed page — activity stream + following filter |
| `src/components/layout/` | Navigation shell: BottomTabs, TopBar, PageShell |
| `src/components/feed/` | Home feed: ProductCard, FilterChips (with nearby range dropdown), FeedGrid |
| `src/components/product/` | Product detail: RatingBars, StoreList, VotingSheet, ImageUploadDialog, ProductComments |
| `src/components/map/` | Leaflet map: ProductMap, ProductPin |
| `src/components/dashboard/` | Chart views: MatrixChart, CoordinateGrid, StatsCard, BadgeDisplay, Leaderboard, DeleteProductButton |
| `src/components/QuadrantPicker.tsx` | Reusable 2×2 quadrant button grid used in VotingSheet, VotingPanel, ImageUploadDialog |
| `src/lib/format-distance.ts` | `formatDistance(km, t)` — shared i18n-aware distance formatter |
| `src/lib/format-time.ts` | `formatRelativeTimeI18n(timestamp, t)` — shared i18n-aware relative time formatter |
| `src/hooks/` | Custom hooks: useAdmin, useGeolocation, useTranslation, useAnonymousId, useVoteMigration, useImpersonate, useTheme, useOnlineStatus |
| `src/hooks/use-product-filter.ts` | Product filter logic — default "nearby" with auto-fallback to "recent"; configurable range via `getNearbyRange`/`setNearbyRange` (localStorage) |
| `src/hooks/use-online-status.ts` | `useOnlineStatus()` — SSR-safe online/offline detection; `useServiceWorker()` — registers `/sw.js` |
| `src/lib/offline-queue.ts` | IndexedDB queue via `idb-keyval`: `enqueue()`, `dequeue()`, `flush()`, `getPendingCount()` |
| `src/components/OfflineBanner.tsx` | Animated amber bar above TopBar when offline |
| `src/components/SyncManager.tsx` | Auto-flushes offline queue on reconnect via Convex mutations |
| `src/components/PendingSyncBadge.tsx` | Floating badge showing pending sync count above BottomTabs |
| `public/sw.js` | Manual service worker — app shell caching (fonts, static assets, HTML pages) |
| `src/lib/i18n.ts` | i18n engine: `setLocale()`, `useLocale()`, `useTranslationHook()` — static JSON imports + CustomEvent |
| `src/hooks/use-translation.ts` | Re-exports `useTranslationHook` as `useTranslation` for component consumption |
| `src/locales/en.json` | English translations (~385 lines, all UI strings) |
| `src/locales/hu.json` | Hungarian translations (~385 lines, mirrors en.json) |

## Coding Conventions

### Strings & Labels (i18n)

All user-facing text must be translatable. The app supports EN + HU with live language switching.

#### Architecture
```
src/locales/en.json  ──┐
src/locales/hu.json  ──┤ static imports
                       ▼
src/lib/i18n.ts ─────── useLocale() hook (useState + CustomEvent listener)
       │                    │
       │              useTranslationHook() → { t, locale, setLocale }
       │                    │
src/hooks/use-translation.ts ── re-exports as useTranslation()
       │
   Components call: const { t } = useTranslation()
                    t('section.key')
                    t('section.key', { param: value })
```

#### How locale switching works
1. `setLocale('hu')` writes to `localStorage('g-matrix-locale')` and dispatches `CustomEvent('g-matrix-locale-change')`
2. Every component using `useTranslation()` re-renders via `useLocale()` which listens for the event
3. SSR-safe: `useLocale()` initializes to `'en'` on server, reads `localStorage` in `useEffect` on client

#### Rules
- **Every component** with user-facing text must call `const { t } = useTranslation()`
- Use dot-notation keys: `t('section.key')` — e.g., `t('nav.home')`, `t('voting.submitVote')`
- Use interpolation for dynamic values: `t('stats.votesCast', { count: 42 })` → `"42 votes cast"`
- **Never hardcode English strings** in components — always use `t()` calls
- Read dimension names from `appConfig.dimensions.axis1.label` (not inline "Safety")
- Read quadrant names from `appConfig.quadrants.topRight.label` (not inline "Holy Grail")
- Niche-specific strings belong in `app-config.ts` or `locales/*.json`, never in components

#### Translation file structure (locale JSON)
The JSON files are organized by section:
```
nav.*           — Navigation labels (home, profile, back, signIn, signOut)
voting.*        — Voting UI (quickVote, submitVote, safety, taste, presets)
quadrants.*     — Quadrant names and descriptions
gamification.*  — Points, badges, streak labels
common.*        — Shared terms (loading, save, cancel, delete, edit, votes)
feed.*          — Home feed (search, filters, empty states)
stats.*         — Stats cards (yourPoints, votesCast, currentStreak)
chart.*         — Chart view labels
leaderboard.*   — Leaderboard labels and descriptions
badge.*         — Badge display labels
scout.*         — Scout status card
product.*       — Product detail page
profile.*       — Profile page
login.*         — Login page
adminPanel.*    — Admin page
deleteProduct.* — Delete confirmation dialog
editProduct.*   — Edit product dialog
adminToolbar.*  — Admin toolbar
location.*      — Map and location labels
theme.*         — Theme toggle labels
imageUpload.*   — Image upload dialog
challenges.*    — Challenges feature
admin.*         — Admin settings
errors.*        — Error messages
offline.*       — Offline banner, sync status, pending count
community.*     — Community feed, comments, likes, time formatting
```

#### Adding a new translated string
1. Add the key to **both** `src/locales/en.json` and `src/locales/hu.json`
2. Use the appropriate section prefix (create new section if none fits)
3. In the component: `import { useTranslation } from '@/hooks/use-translation'`
4. Call `const { t } = useTranslation()` and use `t('section.key')`
5. For interpolation: `"Hello {name}"` in JSON → `t('section.greeting', { name: 'Alice' })` in code

### Styling (Tailwind CSS v4 Architecture)
- **Tailwind v4** uses `@theme inline { ... }` in `globals.css` to register CSS variables as utility classes. The `--color-` prefix is stripped to make class names: `--color-primary` → `bg-primary`, `text-primary`.
- **NEVER use** `bg-color-X` or `text-color-X` classes — these are double-prefixed and won't work. Use `bg-X`, `text-X` instead (e.g., `bg-primary`, `text-foreground`, `bg-safety-high`).
- **Color format**: All CSS variable values MUST be plain HEX (`#7CB342`), never `oklch()`, `hsl()`, or other functional formats. oklch() causes rendering inconsistencies across browsers.
- **Dark mode**: Class-based only (`.dark` selector on `<html>`). NEVER use `@media (prefers-color-scheme: dark)` — it conflicts with the app's theme toggle.
- Use `cn()` helper from `src/lib/utils.ts` to merge conditional Tailwind classes
- Cards: `bg-card text-card-foreground rounded-2xl shadow-sm border border-border`
- Buttons: `rounded-xl` with minimum 44×44px touch target on mobile
- **Product images**: Always use `object-contain` (not `object-cover`) to avoid cropping. Add `bg-muted p-2` for visual padding. Exception: user avatars use `object-cover` for circular crop.

#### Available Custom Utility Classes
These are registered in `@theme inline` and generate Tailwind utility classes:

| CSS Variable | Utility Class | Usage |
|-------------|---------------|-------|
| `--color-safety-high` | `bg-safety-high`, `text-safety-high` | Scores ≥ 60 (green) |
| `--color-safety-mid` | `bg-safety-mid`, `text-safety-mid` | Scores 40-59 (amber) |
| `--color-safety-low` | `bg-safety-low`, `text-safety-low` | Scores < 40 (red) |
| `--color-gold` | `bg-gold`, `text-gold` | Points, badges, streaks |

Standard shadcn/ui tokens (`bg-background`, `bg-card`, `bg-primary`, `text-foreground`, `text-muted-foreground`, `border-border`, etc.) are also in `@theme` and work as expected.

### State Management
- **Server data**: Convex queries via `useQuery(api.products.list)` — real-time, no manual refresh
- **Local UI state**: React `useState` / `useReducer`
- **No global state library** — Convex + React state is sufficient
- **Offline queue**: `src/lib/offline-queue.ts` stores pending actions in IndexedDB via `idb-keyval`. `SyncManager` flushes on reconnect. Use `enqueue('vote', payload)` when `!isOnline`.
- **Forms**: `react-hook-form` with Zod schema validation

### File Organization
- PascalCase for components: `ProductCard.tsx`, `StoreList.tsx`
- camelCase for utilities: `app-config.ts`, `platform.ts`
- kebab-case for hooks: `use-admin.ts`, `use-geolocation.ts`
- Route files follow TanStack Router naming: `$name.tsx` for params, `__root.tsx` for layout

### Imports
- `@/` alias for `src/` directory
- `@convex/` alias for `convex/_generated/` 
- Group: React → external libs → `@/components` → `@/hooks` → `@/lib` → types

### Error Handling
- Wrap mutations in try/catch
- Show user-friendly toast via Sonner on error
- Log full error details server-side (`console.error` in Convex functions)
- Never expose internal error messages to users

### Component Patterns
- **Pages** (in `routes/`): Fetch data via Convex queries, pass to components via props
- **Components**: Accept data via props, render UI, emit events via callbacks
- **Self-contained widgets** (Leaderboard, BadgeDisplay): OK to have internal data fetching
- **Always** wrap route components in `<Suspense>` when they use hooks that may suspend

### Chart & Feed UX
- **Chart modes**: `MatrixChart` supports `mode="vibe"` (safety x taste) and `mode="value"` (price x taste). Use `appConfig.valueLens` for labels and quadrant names in value mode.
- **Chart ↔ list sync**: Clicking a chart dot should scroll to the product card; clicking a card should highlight the dot. Keep the scroll behavior smooth and mobile-friendly.

### Voting UX
- **Fine tune UI lives in `VotingSheet`** as a collapsible section with sliders and a quadrant preview. Avoid adding new fine-tune layouts elsewhere unless required.
- **Store selection** should prefer `appConfig.storeDefaults[locale]` via the dropdown, with a custom store fallback.
- **Geolocation**: Use `useGeolocation` hook for any feature requiring location. Always handle permission denied states gracefully with UI feedback.

### Nearby Range (Configurable)
- Default home filter is **"nearby"** with auto-fallback to "recent" if no products are within range or GPS is unavailable.
- Range options: `[1, 2, 5, 10, 25, 50]` km — defined in `NEARBY_RANGE_OPTIONS` in `src/hooks/use-product-filter.ts`.
- Stored in `localStorage('g-matrix-nearby-range')`, default 5 km.
- **Two UIs to change range**: (1) Quick dropdown on FilterChips — tap active "Nearby" chip to expand range picker. (2) "Nearby Range" pill buttons in Profile → Settings section.
- Cross-component sync via `CustomEvent('g-matrix-nearby-range-change')` — `setNearbyRange(km)` dispatches the event; `useProductFilter` listens and updates.

### Community & Comments
- **Community feed** (`/community`): Aggregates votes, new products, and comments into a chronological activity stream. Supports "All" vs "Following" tab.
- **Product comments** (`ProductComments` component on product detail page): Threaded replies (1 level deep), like/unlike, edit (owner), soft-delete (owner or admin), 500 char max.
- **Leaderboard** lives in Profile page (below badges), not as a separate bottom tab.
- **Bottom tabs**: Home | Community | ➕ Add | Map | Profile.

### Common Pitfalls (Learned from experience)
- **Navigation**: ALWAYS use `<Link>` from `@tanstack/react-router` for internal navigation. NEVER use `<a>` tags (causes full app reload/auth flicker).
- **Icons**: Pass icons as JSX elements (e.g., `icon={<Trophy className="..." />}`) rather than component references (`icon={Trophy}`). This ensures proper styling control.
- **Side Effects**: NEVER call `navigate` or `setState` directly in the component body. Always wrap side effects in `useEffect` or event handlers.
- **Z-Index**: Be careful with stacking contexts. Toast/Dialogs > Dropdowns > Sticky Headers > Content.
- **Button Content**: When overriding button children (e.g. for icon-only buttons), You MUST provide the visible Icon element. Passing only `sr-only` text will result in a blank button. Always verify the button renders with visible content.
- **i18n**: Never hardcode user-facing English strings. Always use `t('key')` from `useTranslation()`. If you add a new string, add it to BOTH `en.json` and `hu.json` before using it. Missing keys silently return the key path as fallback text.
- **Circular imports in `convex/`**: `auth.ts` must NOT import from `customFunctions.ts` — it creates a circular dependency (`auth.ts` → `customFunctions.ts` → `authHelpers.ts` → `auth.ts`) that crashes Convex push with `"X is not a function"`. See Known Issues section.

### Known Issues & Workarounds

#### Circular Dependency in `convex/auth.ts` (Convex Push Failure)
**Problem**: If `convex/auth.ts` imports from `convex/lib/customFunctions.ts` (e.g., `publicQuery`), it creates a **circular dependency** chain:
```
auth.ts → customFunctions.ts → authHelpers.ts → auth.ts
```
Convex uses esbuild to bundle functions. Circular imports cause module-scope variables (like `publicQuery`) to be `undefined` when the importing module evaluates, resulting in:
```
Uncaught Failed to analyze actions/nearbyProduct.js: CA is not a function
    at <anonymous> (../../../convex/auth.ts:89:9)
```
The minified `CA` corresponds to `publicQuery` — it hasn't been initialized yet due to the import cycle.

**Solution**: **Never import from `customFunctions.ts` in `auth.ts`.** The `auth.ts` file should only export `authComponent` and `createAuth`. If you need a query like `getCurrentUser` that uses both `publicQuery` and `authComponent`, define it in a separate file (e.g., `convex/users.ts`) that breaks the cycle:
```ts
// ✅ OK — convex/users.ts (no cycle)
import { publicQuery } from './lib/customFunctions'
import { authComponent } from './auth'
export const getCurrentUser = publicQuery({ ... })

// ❌ BAD — convex/auth.ts (creates cycle)
import { publicQuery } from './lib/customFunctions'  // cycle!
export const getCurrentUser = publicQuery({ ... })
```

**How to detect**: Run `npx convex dev --once`. If you see `"X is not a function"` pointing at `auth.ts`, check for circular imports between `auth.ts` and `customFunctions.ts`.

#### Capacitor Android ProGuard Compatibility (AGP 9.x+)
**Problem**: Capacitor v8 plugins (`@capacitor/camera`, `@capacitor/geolocation`, `@capacitor/share`, `@capacitor/haptics`, `better-auth-capacitor`, `capacitor-camera-view`) use the deprecated `proguard-android.txt` file, which causes build failures with Android Gradle Plugin 9.x+:
```
`getDefaultProguardFile('proguard-android.txt')` is no longer supported
```

**Solution**: Automated via `postinstall` script:
- `scripts/patch-capacitor-android.sh` patches `node_modules/@capacitor/*/android/build.gradle` files to use `proguard-android-optimize.txt`
- Runs automatically after `npm install` via `package.json` postinstall hook
- Manual run: `bash scripts/patch-capacitor-android.sh`
- Currently patches 6 plugins: camera, geolocation, share, haptics, better-auth-capacitor, capacitor-camera-view

**Why not update plugins?** Capacitor 8.0.0 is the latest v8 release. The fix is in Capacitor 9.x, which requires updating the core Capacitor packages and potentially breaking changes. The postinstall patch is stable and low-risk.

**If you encounter Android build errors after `npm install`**:
1. Verify the postinstall script ran: check for "✅ All Capacitor Android plugins patched" in install output
2. If missing, manually run: `bash scripts/patch-capacitor-android.sh`
3. In Android Studio: **File → Sync Project with Gradle Files** or run `./gradlew clean` in `android/` directory

**Adding new plugins**: If you install a new Capacitor plugin that fails with ProGuard errors, add its path to the `PLUGINS` array in `scripts/patch-capacitor-android.sh`.

#### iOS Logging Behavior (Platform Limitation)
**Problem**: iOS builds show verbose logs including:
- Capacitor native bridge logs (`⚡️ To Native →`, `⚡️ TO JS`)
- better-auth-capacitor session tokens in console
- SQLite debug output from preferences plugin

**Not Fixable via Code**: These logs are controlled by Xcode's build configuration, not code. The `loggingBehavior` option in `capacitor.config.ts` is invalid/non-functional.

**Solution**: Use **Release** build configuration in Xcode:
1. In Xcode, click the scheme dropdown (next to Stop button)
2. Select **Edit Scheme...**
3. Under **Run** → **Info** → **Build Configuration** → Select **Release**
4. Build and run — logs will be minimal

**Why this matters**:
- Debug builds are intended for development with verbose logging
- Release builds strip most logs for production use
- Session tokens in logs are a **security concern** in production
- This is standard iOS behavior, not a Capacitor bug

**Reference**: See `docs/IOS_LOGGING.md` for detailed explanation.

#### iOS SceneDelegate Incompatibility
**Problem**: Capacitor v8 has known compatibility issues with iOS SceneDelegate architecture (GitHub issues #6662, #7961). Attempting to add SceneDelegate support results in:
- Black screen on app launch
- Frozen UI with no error messages
- UIScene lifecycle methods conflicting with Capacitor's window management

**Solution**: Use traditional **AppDelegate** approach:
- `ios/App/App/AppDelegate.swift` should NOT implement UISceneSession lifecycle methods
- Remove `UIApplicationSceneManifest` configuration from `Info.plist`
- Delete any `SceneDelegate.swift` file
- Ensure `AppDelegate` has `var window: UIWindow?` property

**Why this matters**:
- SceneDelegate is required for iPadOS multi-window support
- Capacitor v8 predates widespread SceneDelegate adoption
- Workaround: Wait for Capacitor v9+ (requires migration effort)
- Alternative: Stick with single-window AppDelegate pattern

**UIScene warnings are harmless**: Xcode may warn "UISceneConfigurationName doesn't exist" — these warnings don't affect app functionality when using AppDelegate.

#### Capacitor + TanStack Start SPA Architecture

**Problem**: TanStack Start is an SSR framework — its build output has no `index.html` (the server generates HTML dynamically). Capacitor requires static files with an `index.html` in `webDir`.

**Solution**: TanStack Start's official **SPA Mode** (`spa: { enabled: true }` in `vite.config.ts`) generates a static SPA shell alongside the SSR build. We configure `spa.prerender.outputPath: '/index.html'` so the shell lands at `dist/client/index.html` — exactly what Capacitor expects.

**How the dual-target build works**:
```
npm run build
  ├── SSR build → dist/server/  (Cloudflare Workers deployment)
  └── SPA shell → dist/client/index.html  (Capacitor bundles this into native apps)

npx cap sync  →  copies dist/client/* into ios/App/App/public/ and android/app/src/main/assets/public/
```

**Auth in SPA mode**: The `getAuth()` server function in `__root.tsx` is wrapped in try/catch. On Cloudflare (SSR), it fetches the token server-side for pre-authenticated rendering. On Capacitor (SPA), it gracefully fails and `ConvexBetterAuthProvider` handles client-side auth instead.

**Auth client baseURL**: In `src/lib/auth-client.ts`, native apps use `VITE_CONVEX_SITE_URL` (e.g., `https://fabulous-horse-363.eu-west-1.convex.site`) as the auth endpoint. Web apps use `undefined` (relative to current origin, proxied through SSR).

**Capacitor schemes** (in `capacitor.config.ts`):
- iOS: `capacitor://localhost` (default) — WKWebView **cannot** use `http://` or `https://` as custom scheme
- Android: `https://localhost` (default)
- Both are added to `trustedOrigins` in `convex/auth.ts`

**Key files for Capacitor**:
| File | Role |
|------|------|
| `vite.config.ts` | SPA mode config (`spa.prerender.outputPath`) |
| `capacitor.config.ts` | Capacitor config (webDir, schemes, plugin settings) |
| `src/lib/auth-client.ts` | Auth baseURL routing (native vs web) + `withCapacitor()` wrapper |
| `src/lib/platform.ts` | `isNative()`, `isIOS()`, `isAndroid()` detection |
| `convex/auth.ts` | `trustedOrigins` includes Capacitor scheme URLs + `capacitor()` server plugin |
| `convex/http.ts` | Native OAuth Cookie Bridge — Proxy wrapper that injects session cookie into redirect URL |
| `src/routes/__root.tsx` | `getAuth()` try/catch for SPA graceful fallback |
| `scripts/patch-capacitor-android.sh` | ProGuard fix for AGP 9.x+ |

#### Native Auth (OAuth on Capacitor)

**Problem**: Google blocks OAuth sign-in from embedded WebViews. The Capacitor WKWebView is not a real browser, so `signIn.social()` fails silently on native.

**Solution**: Use `better-auth-capacitor` package (`productdevbook/better-auth-capacitor`) which:
1. Opens OAuth in the **system browser** (Safari/Chrome) via `ASWebAuthenticationSession` (iOS) / Custom Tabs (Android)
2. Handles the callback via **deep links** using a custom URL scheme (`gmatrix://`)
3. Caches sessions in `@capacitor/preferences` for offline-first auth
4. Provides `withCapacitor()` wrapper that disables default redirect plugins on native

**Server side** (`convex/auth.ts`):
```ts
import { capacitor } from 'better-auth-capacitor'
betterAuth({
  baseURL: process.env.CONVEX_SITE_URL, // NOT SITE_URL from .env.local
  plugins: [convex({ authConfig }), capacitor()],
})
```

**Client side** (`src/lib/auth-client.ts`):
```ts
import { withCapacitor } from 'better-auth-capacitor/client'
const authClient = createAuthClient(withCapacitor({
  baseURL: isNative() ? VITE_CONVEX_SITE_URL : undefined,
  plugins: [convexClient()],
}, {
  scheme: 'gmatrix',
  storagePrefix: 'better-auth',
}))
```

**HTTP layer — Convex Cookie Bridge** (`convex/http.ts`):
The `capacitor()` plugin's after-hook reads `set-cookie` from `responseHeaders` to append session cookies to the native redirect URL. In Convex runtime, this hook **never executes** because Better Auth throws an `APIError` (302) which bypasses after-hooks. The fix wraps `auth.handler()` with a Proxy at the HTTP layer that post-processes 302 redirects to non-HTTP schemes (like `gmatrix://`), injecting the `set-cookie` value as a `?cookie=` query param on the redirect URL. See `convex/http.ts` for the implementation.

**CORS** (`convex/http.ts`):
`registerRoutes()` must be called with `cors` option to enable OPTIONS preflight for Capacitor WebView cross-origin requests:
```ts
authComponent.registerRoutes(http, createAuthWithNativeBridge, {
  cors: {
    allowedHeaders: ['capacitor-origin', 'x-skip-oauth-proxy'],
    exposedHeaders: ['set-auth-token'],
  },
})
```

**Deep link config**:
- iOS `Info.plist`: `CFBundleURLSchemes` → `gmatrix`
- Android `AndroidManifest.xml`: intent-filter with `android:scheme="gmatrix"`
- OAuth callbackURL: `/auth/callback` (plugin converts to `gmatrix://auth/callback`)
- Google Cloud Console: Add `{CONVEX_SITE_URL}/api/auth/callback/google` as authorized redirect URI

**Dependencies**: `better-auth-capacitor`, `@capacitor/preferences`, `@capacitor/app`

**Reference repos**:
- https://github.com/productdevbook/better-auth-capacitor (official plugin)
- https://github.com/daveyplate/better-auth-capacitor (alternative approach)
- https://github.com/daveycodez/tanstack-start-hybrid (TanStack Start + Capacitor hybrid)
- https://github.com/aaronksaunders/tanstack-capacitor-mobile-1 (TanStack Start + Capacitor tutorial)

#### Native Mobile UX (Capacitor WebView)

**Safe areas**: All layout components use `env(safe-area-inset-*)` CSS variables:
- `TopBar` uses `.safe-top` class — extends background behind status bar, keeps interactive content below
- `BottomTabs` uses a `.safe-bottom` spacer div — fills home indicator area with nav background
- `PageShell` uses `calc(env(safe-area-inset-top) + 3rem)` for content offset
- Viewport meta includes `viewport-fit=cover` to enable safe area access

**CSS for native feel** (in `globals.css`):
- `overscroll-behavior: none` — prevents rubber-band bounce
- `touch-action: manipulation` — removes 300ms tap delay
- `-webkit-tap-highlight-color: transparent` — removes blue flash on tap
- `-webkit-user-select: none` on body — native feel (re-enabled on inputs)
- `maximum-scale=1, user-scalable=no` in viewport meta — prevents pinch zoom

**Orientation**: Locked to portrait on both platforms (Info.plist + AndroidManifest.xml)

**Status bar**: `black-translucent` style with `overlaysWebView: true` in Capacitor config

**Permissions** (already configured):
- iOS Info.plist: `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSLocationWhenInUseUsageDescription`
- Android AndroidManifest: `CAMERA`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `READ_MEDIA_IMAGES`

## Design Tokens

The app uses a sage green / cream design system defined in `globals.css`:

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#7CB342` (Sage Green) | Buttons, active tabs, accents |
| Primary Dark | `#558B2F` (Forest Green) | Hover states, emphasis |
| Background | `#FAF8F5` (Cream) | Page background |
| Surface | `#FFFFFF` (White) | Cards, dialogs |
| Text | `#2D3436` (Charcoal) | Primary text |
| Text Secondary | `#636E72` (Gray) | Secondary text, labels |
| Safety High | `#27AE60` (Green) | Scores ≥ 60 |
| Safety Mid | `#F39C12` (Amber) | Scores 40-59 |
| Safety Low | `#E74C3C` (Red) | Scores < 40 |
| Achievement | `#F1C40F` (Gold) | Points, badges, streaks |
| Font | Inter | All text, loaded from Google Fonts |

### Dark Mode Palette & Semantic Usage
- Background: `#0F172A` (Deep Navy)
- Surface/Card: `#1E293B` (Slate)
- Primary: `#7CB342` (Sage Green — consistent with light mode)
- Accent: `#FBBF24` (Amber — used for highlights)
- Destructive: `#F87171` (Soft Red)
- Text: `#F1F5F9`, Secondary text: `#94A3B8`
- Safety High: `#4ADE80`, Safety Mid: `#FBBF24`, Safety Low: `#F87171`

## Styling Best Practices
1. **Semantic Tokens**: ALWAYS use semantic classes (`bg-background`, `text-foreground`, `border-border`) instead of hardcoded colors (`bg-white`, `text-gray-900`) or raw hex codes. This ensures Dark Mode works "for free".
2. **FOUC Prevention**: To prevent theme flashing, use a blocking inline script in `root.tsx` (head) that reads `localStorage` and sets the `dark` class before React hydrates.
3. **Mobile First**: Default styles are mobile. Use `md:` and `lg:` for desktop overrides.
4. **Touch Targets**: All interactive elements must be at least 44x44px (height/width 11 or p-3).
5. **HEX Only**: All color values in `globals.css` `:root` and `.dark` must be plain HEX codes. Never use `oklch()`, `rgb()`, or `hsl()` — they cause cross-browser inconsistencies.
6. **No `@media (prefers-color-scheme)`**: Dark mode is toggled via `.dark` class on `<html>`. System-preference media queries conflict with the manual toggle and MUST NOT be used.
7. **Custom color classes**: Use `bg-safety-high`, `text-safety-low`, `text-gold` etc. — NOT `bg-color-safety-high` (double prefix doesn't exist in @theme).
8. **Product images**: Use `object-contain` everywhere for product images (prevents cropping). Use `object-cover` only for user avatars.

Cards: `bg-card text-card-foreground rounded-2xl shadow-sm border border-border`

## What NOT To Do

- ❌ Don't hardcode niche strings ("gluten", "celiac", "Holy Grail") in components — use config/i18n
- ❌ Don't use `window`, `document`, `localStorage`, `navigator` outside `useEffect` or `<ClientOnly>` — SSR will break
- ❌ Don't create component files over 200 lines without splitting
- ❌ Don't add npm dependencies without checking bundle size impact (especially on mobile)
- ❌ Don't modify `convex/schema.ts` field names without a migration plan
- ❌ Don't skip `<Suspense>` boundaries on route components that use Convex queries
- ❌ Don't use `any` types — use proper TypeScript types from `src/lib/types.ts`
- ❌ Don't fetch data in child components when the parent page already has it — pass via props
- ❌ Don't import from `convex/` directly in components — use the generated `api` object
- ❌ Don't add user-facing strings without adding them to both `src/locales/en.json` and `src/locales/hu.json`
- ❌ Don't use hardcoded English text in JSX — always use `t('section.key')` from `useTranslation()`
- ❌ Don't manually upload environment variables to Convex one-by-one — always add them to your local `.env` and run `npm run env:upload` (or `node scripts/upload-env.js`) to sync them with Convex.
- ❌ Don't open OAuth in the Capacitor WebView — Google blocks it. Use system browser via `better-auth-capacitor`
- ❌ Don't hardcode padding/margins for notch/home indicator — use `env(safe-area-inset-*)` CSS variables
- ❌ Don't use `<a>` tags for OAuth — on native, use `signIn.social()` with `better-auth-capacitor` which routes through system browser
- ❌ Don't try to create products offline — image upload + AI analysis requires network connectivity. Votes CAN be queued offline.
- ❌ Don't try to disable iOS Capacitor logs via code — use Release build configuration in Xcode instead (see Known Issues)
- ❌ Don't implement SceneDelegate on iOS — Capacitor v8 is incompatible, use traditional AppDelegate (see Known Issues)
- ❌ Don't expect MacBook trackpad pinch-to-zoom on Leaflet maps — use scrollWheelZoom + boxZoom instead (enable all zoom methods)
- ❌ Don't test GPS features in Android emulator without setting mock location — GPS is unavailable by default (see `docs/ANDROID_EMULATOR_LOCATION.md`)

### Offline Support Architecture

**How offline works:**
```
User goes offline → OfflineBanner appears (amber bar)
                  → VotingSheet enqueues votes to IndexedDB
                  → PendingSyncBadge shows "N pending"

User comes online → SyncManager flushes queue via Convex mutations
                  → Toast: "All changes synced!"
                  → Badge disappears
```

**Key rules:**
- **Votes**: Queued offline via `enqueue('vote', payload)` in `product/$name.tsx`. `SyncManager` calls `api.votes.cast` on reconnect.
- **Product creation**: Disabled when offline (needs image upload + AI). Submit/Draft buttons are disabled with warning.
- **Service worker**: Manual (`public/sw.js`) — NOT `vite-plugin-pwa`. Three strategies: cache-first (fonts), stale-while-revalidate (JS/CSS/images), network-first (HTML).
- **Never cache** Convex WebSocket or API requests.
- **Custom events**: The queue dispatches `'offline-queue-change'` events for reactive UI updates.
- **Retry logic**: Failed syncs retry up to 3 times before being marked as permanently failed.

## Planning Documents

| File | Purpose |
|------|---------|
| `docs/planning/ACTION_PLAN.md` | Work backlog with checkboxes for progress |
| `docs/planning/FINISHED_TASKS.md` | Completed tasks archive |
| `docs/planning/FUTURE_PLANS.md` | Long-term planning and ideas |
| `docs/FEATURE_GAP_ANALYSIS.md` | Feature comparison vs. previous app versions (g-matrix, g-convex) |
| `docs/MOBILE_DEPLOYMENT.md` | Mobile deployment guide for iOS and Android |
| `docs/planning/references/` | Design reference materials |

## Legacy Codebases (Local Reference)

This app evolved from two previous versions. When implementing features, **check how they were solved before**:

| Path | Description |
|------|-------------|
| `/Users/mandulaj/dev/source/g-matrix/` | Original Vue.js app with chart visualizations, voting UX patterns, admin features |
| `/Users/mandulaj/dev/source/g-convex/` | Previous Convex-based app with backend patterns, schema design, gamification logic |

**When to reference legacy code:**
- Implementing complex features (view tabs, all votes viz, admin voter lists)
- Understanding backend patterns (time-decay, vote aggregation)
- Checking UX flows (voting, store selection, image upload)
- Verifying edge cases (anonymous votes, impersonation, rate limiting)

### Progress Tracking Rules

The `PRIORITY_LIST.md` file has a checkbox (`[ ]` / `[x]`) on every task. Follow these rules:

1. **Before starting work**, check `PRIORITY_LIST.md` for the next unchecked `[ ]` item in the current wave.
2. **After completing a task**, immediately mark it `[x]` in the file.
3. **If a task cannot be completed as described**, do NOT skip it — update the document with a note explaining why, and revise or defer the task.
4. **Wave N+1 should not begin** until all items in Wave N are checked or explicitly replanned.
5. When asked "what's next?", always consult `PRIORITY_LIST.md` for the first unchecked item.

## Working with New Technology

This project uses bleeding-edge tools (TanStack Start v1.159.0, Convex v1.31.6, Capacitor v8, React 19). **Best practice: check official documentation online when working with unfamiliar APIs or patterns.** Don't rely solely on training data — fetch up-to-date docs.

### When to Check Documentation

- Implementing a feature from a library you haven't used recently
- API signature or behavior is uncertain (e.g., "Does `npx cap sync` auto-run after `cap add`?")
- Error messages reference configuration options or CLI flags
- Choosing between multiple approaches (e.g., Capacitor plugins vs. web APIs)

### Ask, Don't Assume

**If unsure about user intent, requirements, or technical decisions — ASK.** Examples:
- "Should this be a client component or can it stay server-side?"
- "Do you want this feature in Wave 1 or can it wait for Wave 2?"
- "The API has changed — should I use the new pattern or maintain backward compatibility?"

Don't silently make assumptions that could derail the plan. The user prefers clarifying questions over incorrect implementations.

### Useful Documentation Links

| Technology | Docs |
|-----------|------|
| TanStack Start | https://tanstack.com/start/latest/docs/framework/react/overview |
| TanStack Router | https://tanstack.com/router/latest/docs/framework/react/overview |
| Convex | https://docs.convex.dev/home |
| Convex with TanStack Start | https://docs.convex.dev/quickstart/tanstack-start |
| Capacitor | https://capacitorjs.com/docs |
| Capacitor iOS | https://capacitorjs.com/docs/ios |
| Capacitor Android | https://capacitorjs.com/docs/android |
| Leaflet | https://leafletjs.com/reference.html |
| react-leaflet | https://react-leaflet.js.org/docs/start-introduction/ |
| shadcn/ui | https://ui.shadcn.com/docs |
| Tailwind CSS v4 | https://tailwindcss.com/docs |
| Framer Motion | https://www.framer.com/motion/introduction/ |
| better-auth-capacitor | https://github.com/productdevbook/better-auth-capacitor |
| Capacitor Deep Links | https://capacitorjs.com/docs/guides/deep-links |
