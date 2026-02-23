# Action Plan

> **How to use this checklist:**
> 1. Pick the next unchecked `[ ]` item and mark it `[/]` (in progress)
> 2. When done, move it to `FINISHED_TASKS.md`
> 3. If a task **cannot be completed**, do NOT delete it — add a note explaining why (e.g., `[~] Blocked: reason`)
> 4. Keep this file as the **single source of truth** for what to do NEXT (Current Wave).

---

## 🟡 Wave 1 — Remaining Table Stakes (COMPLETED)

*(All items from Wave 1 have now been migrated to `FINISHED_TASKS.md` or replaced by new technologies like OneSignal).*

---

## 🚀 Launch & Release Prep

### 1. Manual Quality Assurance (QA)
- [ ] Read `docs/QA_TEST_PLAN.md` for the full test strategy.
- [ ] Read `docs/WAVE_1_SETUP_REQUIRED.md` to configure your new environment variables.
- [ ] Manually test Core Navigation (App Shell, Bottom Tabs, Dark Mode).
- [ ] Manually test the Smart Camera Pipeline (Permissions -> Barcode Lookup -> AI Analysis -> R2 Upload -> GPS Storage).
- [ ] Manually test the Voting & Offline Sync Flow (Standard vote, disconnected vote, anonymous migration).
- [ ] Manually test Social features (Geospatial Nearby filter, new comments, following feed).

### 2. Observability & Monitoring
- [x] Setup a Sentry account (Free Tier).
- [x] Install `@sentry/react` and `@sentry/capacitor`.
- [x] Initialize Sentry inside `src/router.tsx` to automatically catch global errors.

### 3. App Store Flexibility
- [x] Generate 3 temporary App Store screenshots via `shots.so` to begin listing drafts early (Developer Manual Step).
- [x] Create a public Notion page for Privacy Policy / Terms of Service to avoid hardcoding links inside the binary (Developer Manual Step).
- [x] (Optional) Add a basic Convex `config` table query to feature-flag potentially sensitive UI elements before App Store review.

---

## 🔴 Wave A — Critical Security Fixes

### A1. Backend Auth & Access Control
- [x] **Fix comment impersonation** — `convex/comments.ts`: Convert `post`, `edit`, `remove`, `toggleLike` from `publicMutation` to `authMutation`. Derive `userId` from `ctx.auth` instead of client arg. Remove client-supplied `isAdmin` flag from `remove` — check via `requireAdmin(ctx)` server-side.
- [x] **Lock down push notification actions** — `convex/actions/sendPush.ts`: Change `sendPushToUser` and `sendPushToUsers` from `publicAction` to `internalAction`.
- [x] **Lock down seed mutation** — `convex/seed.ts`: Change `seedProducts` from `publicMutation` to `internalMutation`.
- [x] **Auth-gate product creation** — `convex/products.ts`: Convert `create` from `publicMutation` to `authMutation`.
- [x] **Auth-gate file upload URL** — `convex/files.ts`: Convert `generateUploadUrl` from `publicMutation` to `authMutation`.
- [x] **Lock down deprecated notification endpoints** — `convex/notifications.ts`: Delete or convert `registerToken`, `removeToken`, `getTokensByUser` to `internalMutation`/`internalQuery` (deprecated in favor of OneSignal).
- [x] **Make `checkBadges` internal** — `convex/profiles.ts`: Change from `publicMutation` to `internalMutation`. Update scheduler call in `convex/sideEffects.ts` to `internal.profiles.checkBadges`.
- [x] **Remove client-supplied `currentUserId`** — `convex/community.ts` `getCommunityFeed`: Derive from auth context for "following" filter.

### A2. Admin Route Protection
- [x] **Fix admin route protection** — `src/routes/admin.tsx`: Wrap `navigate()` in `useEffect` (was in render body). Fix operator precedence.
- [x] **Migrate admin functions to middleware** — Replace `publicMutation` + manual `requireAdmin()` in: `convex/profiles.ts` (`addPoints`, `resetStreak`), `convex/settings.ts` (`updateSetting`, `updateSettings`), `convex/reports.ts` (`updateStatus`, `list`, `getByProduct`). Fix `settings.ts` `updateSetting` which checked `profile.role` instead of `requireAdmin` helper (missed `ADMIN_EMAILS` whitelist).

---

## 🟠 Wave B — Performance Fixes

### B1. Database Indexes
- [x] **Add missing indexes to `convex/schema.ts`**: `products.by_creator: ['createdBy']`, `votes.by_product_anonymous: ['productId', 'anonymousId']`, `reports.by_product_status: ['productId', 'status']`, `profiles.by_streak: ['streak']`.

### B2. Fix Full Table Scans
- [x] **Fix `getVotesWithGPS`** — `convex/votes.ts`: Replace `.collect()` on all votes with index-based or geospatial filtering.
- [x] **Fix `getActiveStreakers`** — `convex/profiles.ts`: Use `by_streak` index instead of collecting all profiles.
- [x] **Fix `checkBadges` products scan** — `convex/profiles.ts`: Use `by_creator` index instead of `.collect()` on products.
- [x] **Fix `capturePriceSnapshots` N+1** — `convex/products.ts`: Paginate or only snapshot products with recent votes.

### B3. Fix N+1 & Over-Fetching
- [x] **Fix community feed N+1** — `convex/community.ts` `getCommunityFeed`: Batch-fetch products by collecting unique IDs first, then map results.
- [x] **Fix profile over-fetching** — `src/routes/profile.tsx`: Create `api.products.getByCreator(userId)` query instead of `listAll` + client filter.
- [x] **Fix store over-fetching** — `src/routes/store/$name.tsx`: Create `api.products.getByStore(storeName)` query instead of `listAll` + client filter.

### B4. Frontend Memoization
- [x] **Memoize `MatrixChart` data** — `src/components/dashboard/MatrixChart.tsx`: Wrap `rawData`, `data`, axis labels, quadrant config in `useMemo`. Extract `CustomTooltip` outside component body.
- [x] **Memoize profile computations** — `src/routes/profile.tsx`: Wrap `activities` merge+sort, `myProducts`, level calculations in `useMemo`.
- [x] **Memoize product list** — `src/components/dashboard/ProductList.tsx`: Wrap `filteredProducts`/`sortedProducts` in `useMemo`.

### B5. Build & Runtime Fixes
- [x] **Add manual chunks** — `vite.config.ts`: Add `'leaflet-vendor': ['leaflet', 'react-leaflet']` and `'motion-vendor': ['framer-motion']` to `manualChunks`.
- [x] **Fix `PriceHistoryChart` array mutation** — `src/components/product/PriceHistoryChart.tsx`: `.reverse()` mutates source. Use `[...history].reverse()`.
- [x] **Fix `setInterval` memory leak** — `src/hooks/use-online-status.ts`: Store interval ID from `register()`, clear in `useEffect` cleanup.
- [x] **Fix `PriceHistoryChart` state initializer abuse** — Uses `useState(() => { setMounted(true) })` as side effect. Change to `useEffect`.

---

## 🟡 Wave C — Code Quality & Correctness

### C1. TypeScript & Lint Fixes
- [x] **Fix all 28 TypeScript errors** from `typecheck_output.txt` — 20 unused imports (remove) + 8 type errors (`ImageUploadDialog` union narrowing, `CameraView.capture()` args, `PageShell` invalid `title` prop).
- [x] **Remove `as any` casts** — Replace with proper types in: `src/routes/community.tsx`, `src/routes/files.tsx`, `src/routes/_authenticated/reports.tsx`, `convex/barcode.ts`, `convex/users.ts`.
- [x] **Remove `'use client'` directives** — Meaningless in TanStack Start. Found in 12+ component files.

### C2. Extract Duplicated Code
- [x] **Extract `resolveProductImage` helper** — Same image URL resolution pattern copied 6× in `convex/products.ts`. Create shared helper.
- [x] **Extract `QuadrantPicker` component** — Identical 2×2 button grid in `VotingPanel.tsx`, `VotingSheet.tsx`, `ImageUploadDialog.tsx`. Create shared component.
- [x] **Extract `formatDistance(km)` utility** — Duplicated in `feed/ProductCard.tsx`, `feed/ProductStrip.tsx`, `product/StoreList.tsx`.
- [x] **Consolidate `formatRelativeTime`** — 3 implementations in `ProductComments.tsx`, `StoreList.tsx`, `utils.ts`. Create single i18n-aware version in `src/lib/format-time.ts`.

### C3. Split Oversized Files (>200 lines)
- [x] **Split `ImageUploadDialog.tsx` (856 lines)** → `ReviewStep`, `useImageUpload` hook.
- [x] **Split `product/$name.tsx` (445 lines)** → `ProductChartTabs`.
- [x] **Split `profile.tsx` (460 lines)** → `ProfileSettings`, `ProfileActivityFeed`.
- [x] **Split `ProductComments.tsx` (330 lines)** → `CommentItem.tsx`, `CommentInput.tsx`.

### C4. Bug Fixes
- [x] **Fix stale closure in `useGeolocation`** — `src/hooks/use-geolocation.ts`: Uses stale `state.permissionStatus` in error callbacks. Use functional `setState(prev => ...)`.
- [x] **Fix streak reminder time window** — `convex/actions/streakReminder.ts`: Hours-since-midnight-UTC logic misses late voters. Switch to calendar-day comparison.
- [x] **Fix `ImageUploadDialog` memory leak** — `URL.createObjectURL(file)` in `resizeAndConvertImage` never revoked. Add `URL.revokeObjectURL()`.
- [x] **Deduplicate `handleSaveAsDraft`/`handleSubmit`** — `ImageUploadDialog.tsx`: ~90% identical code. Extract shared `submitProduct()`.

### C5. Delete Dead Code
- [x] **Remove empty `onProductCreated` handler** — `convex/sideEffects.ts`.
- [x] **Remove unused `onVoteDeleted`** — `convex/sideEffects.ts` (defined but never called).
- [x] **Remove deprecated i18n exports** — `src/lib/i18n.ts`: `loadTranslations`, `saveLocalePreference`, `loadLocalePreference`, `I18n` class.
- [x] **Remove no-op `I18nProvider`** — `src/hooks/i18n-context.tsx` (pass-through wrapper).
- [x] **Remove unused `useFeatureFlag` hook** — `src/hooks/use-feature-flag.ts` (never imported).
- [x] **Remove redundant `glutenWarning` locale key** — Both `en.json`/`hu.json` (replaced by generic `riskWarning`).
- [x] **Remove unused dark CSS vars** — `globals.css`: `--safety-high-dark`, `--safety-mid-dark`, `--safety-low-dark`.

---

## 🔵 Wave D — i18n & Accessibility

### D1. Accessibility
- [x] **Add `aria-label` to all icon-only buttons** — Key files: `LanguageSwitcher.tsx`, `BottomTabs.tsx`, `TopBar.tsx`, `VoterList.tsx`, `ProductComments.tsx` (like/reply/edit/delete). Use `t()` keys.

### D2. Translate Components (zero `t()` usage)
- [x] **Translate `VoterList.tsx`** (~15 hardcoded strings).
- [x] **Translate `ReportProductDialog.tsx`** (~20 hardcoded strings).
- [x] **Translate `Navigation.tsx`** (~14 hardcoded strings).
- [x] **Translate `AllVotesChart.tsx`** (~10 hardcoded strings).
- [x] **Translate `FollowButton.tsx`** (~5 hardcoded strings).
- [x] **Translate `NotFound.tsx`** (~4 strings).
- [x] **Translate `ErrorBoundary.tsx`** (~4 strings — needs props-based approach, class component).
- [x] **Translate `store/$name.tsx`** (~10 strings).
- [x] **Translate `files.tsx`** (~10 strings).
- [x] **Translate `_authenticated/reports.tsx`** (~15 strings).
- [x] **Translate `admin.tsx`** — "Safety", "Taste", "votes", "Ingredients".

### D3. Translate Toast Messages
- [x] **Translate toasts in `FollowButton`, `EditProductDialog`, `DeleteProductButton`, `ReportProductDialog`, `VoterList`, `reports.tsx`** (~15 locations total).

### D4. Theme & Styling Fixes
- [x] **Fix hardcoded `<html lang="en">`** — `src/routes/__root.tsx`: Make dynamic from i18n locale.
- [x] **Fix date formatting** — Pass app locale to `toLocaleDateString()` in `profile.tsx`, `admin.tsx`, `reports.tsx`.
- [x] **Fix hardcoded hex colors in charts/maps** — `AllVotesChart.tsx`, `ProductMap.tsx`: Replace `#7CB342`, `#E0E0E0`, etc. with CSS variables / `appConfig.colors`.
- [x] **Fix CSS quadrant color format** — `globals.css`: Convert `--holy-grail` etc. from HSL triplets to HEX.

---

## 🟣 Wave E — Infrastructure & Documentation

### E1. Dependencies
- [x] **Move `@aws-sdk` packages** from `dependencies` to `devDependencies` (only used in Convex server, ~300KB+ client bloat risk).
- [x] **Remove unused deps** — `autoprefixer`, `postcss`, `@better-auth/core`, `better-call`. Verify `@capacitor/browser`.
- [x] **Add `eslint-plugin-react-hooks`** to `eslint.config.mjs` for `exhaustive-deps` rule.

### E2. Security Hardening
- [x] **Fix service worker cache versioning** — `public/sw.js`: Inject build hash instead of hardcoded `gmatrix-v1`.
- [x] **Add CSP headers** — `public/_headers`: Whitelist Google Fonts, Convex, Leaflet tiles, Sentry, R2.
- [x] **Fix trusted origins** — `convex/auth.ts`: Add production Cloudflare Workers domain.

### E3. Scripts & Config
- [x] **Fix `upload-env.js` source file** — Reads `.env` but convention is `.env.local`. Consolidate with `push-env.sh`.
- [x] **Install or remove dead Capacitor plugin config** — `capacitor.config.ts` configures `SplashScreen` and `Keyboard` that aren't installed.
- [x] **Fix `patch-capacitor-android.sh` portability** — `sed -i ''` is macOS-only. Add Linux compat for CI.

### E4. Documentation
- [x] **Update `copilot-instructions.md`** — Fix `docs/newdirection/` → `docs/planning/`. Remove ★ markers from existing files. Add missing files to Key Files table.
- [x] **Enable Sentry source maps** — `vite.config.ts`: Add `sourcemap: 'hidden'`, configure Sentry upload.

### E5. Tests
- [x] **Write unit tests for `src/lib/types.ts`** (quadrant classification, thresholds).
- [x] **Write unit tests for `src/lib/utils.ts`** (helpers, `cn()`).
- [x] **Write i18n key parity test** (en.json vs hu.json structural match).
- [x] **Write unit tests for `src/lib/offline-queue.ts`** (enqueue, dequeue, flush).

---

## 🟢 Phase F — Pre-Release Checklist

### F1. Manual QA on Physical Devices
> Follow `docs/QA_TEST_PLAN.md` and `docs/NATIVE_TESTING_GUIDE.md` on **both iOS and Android** physical devices.

- [ ] Core Navigation & UI Shell — launch, dark mode, bottom tab routing, no spinners
- [ ] Smart Camera Pipeline — permissions → barcode scan → AI analysis → R2 upload → GPS on map
- [ ] Voting & Offline Sync — standard vote, airplane mode vote + sync, anonymous → registered migration
- [ ] Social & Community — nearby filter, comments/likes, follow system, community feed
- [ ] Error Handling (Sentry) — force crash, verify toast (no white screen), check Sentry dashboard
- [ ] Gamification Flow — vote → "+10 Points!" toast → badge unlock → leaderboard → streak tracking
- [ ] Challenges — view active, progress increments on vote, claim reward
- [ ] Admin Dashboard — product CRUD, reports review, settings, analytics
- [ ] Auth Edge Cases — fresh login, session expiry, logout + re-login, native OAuth deep link

### F2. UI Fine-Tuning
- [ ] Responsive breakpoints — iPhone SE (375px), iPhone 15 (393px), Pro Max (430px), Pixel 7 (412px)
- [ ] Safe area insets — content doesn't clip behind notch/dynamic island/home indicator
- [ ] Keyboard handling — forms aren't hidden behind keyboard (voting, comments, product creation)
- [ ] Loading states — every query has skeleton/spinner (no blank screens)
- [ ] Empty states — friendly messages for "No products", "No votes", "No comments"
- [ ] Dark mode audit — every screen readable (contrast, borders, chart colors)
- [ ] Touch targets — all interactive elements ≥ 44×44pt / 48×48dp
- [ ] Image loading — product images have blur placeholder or skeleton, no broken images
- [ ] Scroll performance — product list, community feed, leaderboard scroll smoothly

### F3. Gamification Logic Verification
- [x] **Fix streak bonus** — `sideEffects.ts` now awards `POINTS.STREAK_BONUS` (+15) for 3+ day streaks
- [ ] Badge thresholds — manually test each badge triggers at correct count
- [ ] Streak logic — vote today → vote tomorrow → streak=2; miss a day → resets to 1
- [ ] Vote weight — registered=2x, anonymous=1x in average calculations
- [ ] Challenge completion — vote 10x → challenge completes → claim reward → no double-claim

### F4. Database & Schema Review
- [ ] Remove deprecated `deviceTokens` table (OneSignal manages tokens)
- [ ] Verify `voteCount` = `registeredVotes + anonymousVotes` consistency
- [ ] Spot-check hot queries for full table scans (Convex dashboard → slow queries)

### F5. Security Hardening (Final Pass)
- [x] **Input validation** — product name max 100 chars, trimmed, non-empty
- [x] **Rate limiting** — `products.create` (5/hr), `comments.post` (10/min) added
- [ ] Verify `ADMIN_EMAILS` env var is set in production Convex dashboard
- [ ] Verify `public/_headers` CSP file is deployed on Cloudflare
- [ ] Confirm `sw.js` uses build hash, not hardcoded `gmatrix-v1`
- [ ] Review `handleServerError` — ensure no stack traces leak to client in production

### F6. Observability & Monitoring
- [ ] Verify `VITE_SENTRY_DSN` is set in `.env.local` and production
- [ ] Add `@sentry/vite-plugin` for source map upload on build
- [ ] Verify `GET /api/health` returns `200` on production Convex deployment
- [ ] Run `npx convex logs` during QA to watch for errors
- [ ] Verify console stripping — production builds drop `console.log`

### F7. CSS & Accessibility Polish
- [ ] Replace `100vh` with `100dvh` for full-screen layouts (mobile browser chrome)
- [ ] Honor `prefers-reduced-motion` — audit Framer Motion animations
- [ ] Replace `px` text sizes with `rem` for accessibility
- [ ] Onboarding flow — first-time user tutorial: "Scan your first product" CTA, gamification intro

### F8. App Store & Production Deploy
- [ ] **Cloudflare R2** — set up production bucket, configure env vars (see `WAVE_1_SETUP_REQUIRED.md`)
- [ ] **Convex production deploy** — `npx convex deploy` with production env vars
- [ ] **Cloudflare Workers deploy** — ensure SSR deployment succeeds
- [ ] iOS App Store Connect — screenshots, description, keywords, privacy policy, terms of service
- [ ] Google Play Console — store listing, screenshots, content rating

