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
- [ ] **Extract `resolveProductImage` helper** — Same image URL resolution pattern copied 6× in `convex/products.ts`. Create shared helper.
- [ ] **Extract `QuadrantPicker` component** — Identical 2×2 button grid in `VotingPanel.tsx`, `VotingSheet.tsx`, `ImageUploadDialog.tsx`. Create shared component.
- [ ] **Extract `formatDistance(km)` utility** — Duplicated in `feed/ProductCard.tsx`, `feed/ProductStrip.tsx`, `product/StoreList.tsx`.
- [ ] **Consolidate `formatRelativeTime`** — 3 implementations in `ProductComments.tsx`, `StoreList.tsx`, `utils.ts`. Create single i18n-aware version in `src/lib/format-time.ts`.

### C3. Split Oversized Files (>200 lines)
- [ ] **Split `ImageUploadDialog.tsx` (856 lines)** → `SmartCameraStep`, `ReviewStep`, `SubmitStep`, `useImageUpload` hook.
- [ ] **Split `product/$name.tsx` (445 lines)** → `ProductHero`, `ProductVotingSection`, `ProductChartTabs`.
- [ ] **Split `profile.tsx` (460 lines)** → `ProfileHeader`, `ProfileSettings`, `ProfileActivityFeed`.
- [ ] **Split `ProductComments.tsx` (330 lines)** → `CommentItem.tsx`, `CommentInput.tsx`.

### C4. Bug Fixes
- [x] **Fix stale closure in `useGeolocation`** — `src/hooks/use-geolocation.ts`: Uses stale `state.permissionStatus` in error callbacks. Use functional `setState(prev => ...)`.
- [ ] **Fix streak reminder time window** — `convex/actions/streakReminder.ts`: Hours-since-midnight-UTC logic misses late voters. Switch to calendar-day comparison.
- [x] **Fix `ImageUploadDialog` memory leak** — `URL.createObjectURL(file)` in `resizeAndConvertImage` never revoked. Add `URL.revokeObjectURL()`.
- [ ] **Deduplicate `handleSaveAsDraft`/`handleSubmit`** — `ImageUploadDialog.tsx`: ~90% identical code. Extract shared `createProductPayload()`.

### C5. Delete Dead Code
- [ ] **Remove empty `onProductCreated` handler** — `convex/sideEffects.ts`.
- [x] **Remove unused `onVoteDeleted`** — `convex/sideEffects.ts` (defined but never called).
- [x] **Remove deprecated i18n exports** — `src/lib/i18n.ts`: `loadTranslations`, `saveLocalePreference`, `loadLocalePreference`, `I18n` class.
- [x] **Remove no-op `I18nProvider`** — `src/hooks/i18n-context.tsx` (pass-through wrapper).
- [x] **Remove unused `useFeatureFlag` hook** — `src/hooks/use-feature-flag.ts` (never imported).
- [ ] **Remove redundant `glutenWarning` locale key** — Both `en.json`/`hu.json` (replaced by generic `riskWarning`).
- [x] **Remove unused dark CSS vars** — `globals.css`: `--safety-high-dark`, `--safety-mid-dark`, `--safety-low-dark`.

---

## 🔵 Wave D — i18n & Accessibility

### D1. Accessibility
- [x] **Add `aria-label` to all icon-only buttons** — Key files: `LanguageSwitcher.tsx`, `BottomTabs.tsx`, `TopBar.tsx`, `VoterList.tsx`, `ProductComments.tsx` (like/reply/edit/delete). Use `t()` keys.

### D2. Translate Components (zero `t()` usage)
- [x] **Translate `VoterList.tsx`** (~15 hardcoded strings).
- [x] **Translate `ReportProductDialog.tsx`** (~20 hardcoded strings).
- [ ] **Translate `Navigation.tsx`** (~14 hardcoded strings).
- [x] **Translate `AllVotesChart.tsx`** (~10 hardcoded strings).
- [x] **Translate `FollowButton.tsx`** (~5 hardcoded strings).
- [x] **Translate `NotFound.tsx`** (~4 strings).
- [ ] **Translate `ErrorBoundary.tsx`** (~4 strings — needs props-based approach, class component).
- [ ] **Translate `store/$name.tsx`** (~10 strings).
- [ ] **Translate `files.tsx`** (~10 strings).
- [ ] **Translate `_authenticated/reports.tsx`** (~15 strings).
- [ ] **Translate `admin.tsx`** — "Safety", "Taste", "votes", "Ingredients".

### D3. Translate Toast Messages
- [ ] **Translate toasts in `FollowButton`, `EditProductDialog`, `DeleteProductButton`, `ReportProductDialog`, `VoterList`, `reports.tsx`** (~15 locations total).

### D4. Theme & Styling Fixes
- [x] **Fix hardcoded `<html lang="en">`** — `src/routes/__root.tsx`: Make dynamic from i18n locale.
- [ ] **Fix date formatting** — Pass app locale to `toLocaleDateString()` in `profile.tsx`, `admin.tsx`, `reports.tsx`.
- [ ] **Fix hardcoded hex colors in charts/maps** — `AllVotesChart.tsx`, `ProductMap.tsx`: Replace `#7CB342`, `#E0E0E0`, etc. with CSS variables / `appConfig.colors`.
- [ ] **Fix CSS quadrant color format** — `globals.css`: Convert `--holy-grail` etc. from HSL triplets to HEX.

---

## 🟣 Wave E — Infrastructure & Documentation

### E1. Dependencies
- [x] **Move `@aws-sdk` packages** from `dependencies` to `devDependencies` (only used in Convex server, ~300KB+ client bloat risk).
- [x] **Remove unused deps** — `autoprefixer`, `postcss`, `@better-auth/core`, `better-call`. Verify `@capacitor/browser`.
- [x] **Add `eslint-plugin-react-hooks`** to `eslint.config.mjs` for `exhaustive-deps` rule.

### E2. Security Hardening
- [x] **Fix service worker cache versioning** — `public/sw.js`: Inject build hash instead of hardcoded `gmatrix-v1`.
- [ ] **Add CSP headers** — `wrangler.jsonc` or middleware: Whitelist Google Fonts, Convex, Leaflet tiles, Sentry, R2.
- [x] **Fix trusted origins** — `convex/auth.ts`: Add production Cloudflare Workers domain.

### E3. Scripts & Config
- [x] **Fix `upload-env.js` source file** — Reads `.env` but convention is `.env.local`. Consolidate with `push-env.sh`.
- [x] **Install or remove dead Capacitor plugin config** — `capacitor.config.ts` configures `SplashScreen` and `Keyboard` that aren't installed.
- [x] **Fix `patch-capacitor-android.sh` portability** — `sed -i ''` is macOS-only. Add Linux compat for CI.

### E4. Documentation
- [ ] **Update `copilot-instructions.md`** — Fix `docs/newdirection/` → `docs/planning/`. Remove ★ markers from existing files. Add missing files to Key Files table.
- [ ] **Enable Sentry source maps** — `vite.config.ts`: Add `sourcemap: true`, configure Sentry upload.

### E5. Tests
- [x] **Write unit tests for `src/lib/types.ts`** (quadrant classification, thresholds).
- [x] **Write unit tests for `src/lib/utils.ts`** (helpers, `cn()`).
- [x] **Write i18n key parity test** (en.json vs hu.json structural match).
- [ ] **Write unit tests for `src/lib/offline-queue.ts`** (enqueue, dequeue, flush).

### 2. Observability & Monitoring
- [x] Setup a Sentry account (Free Tier).
- [x] Install `@sentry/react` and `@sentry/capacitor`.
- [x] Initialize Sentry inside `src/router.tsx` to automatically catch global errors.

### 3. App Store Flexibility
- [x] Generate 3 temporary App Store screenshots via `shots.so` to begin listing drafts early (Developer Manual Step).
- [x] Create a public Notion page for Privacy Policy / Terms of Service to avoid hardcoding links inside the binary (Developer Manual Step).
- [x] (Optional) Add a basic Convex `config` table query to feature-flag potentially sensitive UI elements before App Store review.
