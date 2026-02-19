# Action Plan

> **How to use this checklist:**
> 1. Pick the next unchecked `[ ]` item and mark it `[/]` (in progress)
> 2. When done, mark it `[x]` and note the date
> 3. If a task **cannot be completed**, do NOT delete it — add a note explaining why (e.g., `[~] Blocked: reason`)
> 4. After each task, update relevant docs:
>    - Project docs (`docs/`, `README.md`, `.github/copilot-instructions.md`)
>    - If the pattern/know-how is reusable, document it in project `docs/` as knowledge base
>    - Template upstream: if the pattern is generic, port it to `/Users/mandulaj/dev/source/convex-tanstack-cloudflare/docs`
> 5. Keep this file as the **single source of truth** for what to do next

---

## ✅ Wave 0 — Mobile-First Foundation (DONE)

### Mobile-First Redesign
- [x] Implement `BottomTabs.tsx` (Home | Leaderboard | ➕ Add | Map | Profile)
- [x] Implement `TopBar.tsx` (logo + GPS + lang + theme + points badge + auth avatar)
- [x] Implement `PageShell.tsx` (safe areas, padding, scroll container)
- [x] Redesign `index.tsx` as feed-based page with filter chips (All/Recent/Nearby/Trending) + product card grid
- [x] Add Feed ↔ Chart toggle on home page (scatter chart as alternate view)
- [x] Add Vibe ↔ Value chart mode toggle (🛡️ Vibe / 💰 Value)
- [x] Redesign `product/$name.tsx` for mobile (hero → rating bars → stores → voting → chart tabs)
- [x] Redesign `profile.tsx` for mobile (user header + level bar → stats → badges → dietary → activity feed → settings)
- [x] Adapt `login.tsx` for mobile with benefits list
- [x] Update `__root.tsx` layout: TopBar + BottomTabs shell, PWA meta tags
- [x] Apply Kimi design system: sage green palette, Inter font, card styles, touch targets, dark mode

### PWA Setup
- [x] Create `public/manifest.json` (standalone, theme_color #7CB342, portrait-primary)
- [x] Add PWA meta tags to `__root.tsx` (apple-mobile-web-app-capable, theme-color, viewport-fit=cover)
- [x] Generate app icons (192px, 512px, maskable — SVG)
- [x] Add service worker for app shell caching — `public/sw.js` (manual, not vite-plugin-pwa)

### Niche-Agnostic Refactor
- [x] `MatrixChart.tsx` reads labels/colors from `appConfig.quadrants`
- [x] `VotingPanel.tsx`, `VotingSheet.tsx` use `appConfig.quadrants` for buttons
- [x] `ImageUploadDialog.tsx` uses `appConfig.quadrants` + `appConfig.riskConcept`
- [x] `ProductCard.tsx`, `ProductStrip.tsx` use `appConfig.quadrants`
- [x] `login.tsx`, `__root.tsx` use `appConfig.appName` + `appConfig.tagline`
- [x] `globals.css` uses Kimi design tokens (sage green, charcoal, cream, slate dark)
- [x] "gluten"/"celiac" strings only in `app-config.ts` + Convex AI prompt — ✅ niche-agnostic

### Product Detail Features
- [x] View tabs (Average / My Vote / All Votes / Price History) — `product/$name.tsx`
- [x] `RatingBars` component (safety, taste, price percentage bars)
- [x] `StoreList` component with stores on product page
- [x] `VotingSheet` mobile-optimized voting interface
- [x] `AllVotesChart` — every vote as dot on grid
- [x] `PriceHistoryChart` — price trend visualization
- [x] `ShareButton` — share product
- [x] `ReportProductDialog` — report product
- [x] `EditProductDialog` + `DeleteProductButton` — admin edit/delete
- [x] `VoterList` — admin voter list with impersonation
- [x] `CoordinateGrid` — interactive 2D grid for voting
- [x] `StoreTagInput` — store dropdown with autocomplete

### Profile Features
- [x] User header card (avatar, name, email, level badge, XP progress bar)
- [x] Stats grid (points, streak, votes, products, followers, following)
- [x] `BadgeDisplay` component
- [x] `DietaryProfileSettings` component
- [x] Contributions/activity feed (votes + product additions)
- [x] Settings section (location, language, theme, sign out)

### Gamification & Feed
- [x] `ScoutCard` popover in TopBar (points + badge summary)
- [x] `StatsCard` widgets on home page (points, streak, badges)
- [x] Filter chips (All / Recent / Nearby / Trending) with distance-based filtering
- [x] Search bar with clear button
- [x] `Leaderboard` component

### Backend
- [x] Time-decay cron (daily recalculation with exponential decay)
- [x] Batch recalculate all products (admin mutation)
- [x] Streak maintenance cron (2 AM UTC)
- [x] Settings table for configurable parameters

---

## 🟡 Wave 1 — Remaining Table Stakes

### Barcode Scanner
> Camera upload + AI analysis already work. Barcode scanning + Open Food Facts lookup now wired.
- [x] Evaluate barcode scanning libraries → `capacitor-camera-view` chosen (native overlay + auto barcode detection)
- [x] Add barcode reader component → `SmartCamera.tsx` with `useCameraView` hook
- [x] Integrate Open Food Facts API → `convex/barcode.ts` (`lookupBarcode` action + `findByBarcode` query)
- [x] Create "Scan → Review → Rate → Done" flow → Wired into `ImageUploadDialog.tsx` (scan step → barcode-lookup → pre-fill form → review)

### Push Notifications
> Scaffolding complete. External Firebase/APNs setup required to deliver messages.
- [~] Set up Firebase Cloud Messaging (FCM) + APNs — **Replaced by OneSignal.** See `docs/PUSH_NOTIFICATIONS_SETUP.md`
- [x] Store device tokens in Convex → `convex/notifications.ts` (DEPRECATED — OneSignal manages tokens internally)
- [x] Push notifications hook → `src/hooks/use-push-notifications.ts` (rewritten for OneSignal SDK)
- [x] Implement "streak about to expire" reminder → `convex/actions/streakReminder.ts` + cron at 8 PM UTC (2026-02-16)
- [x] Implement "new product near you" alert → `convex/actions/nearbyProduct.ts` + triggered on product creation with GPS (2026-02-16)
- [x] Integrate OneSignal for push delivery → `onesignal-cordova-plugin` + REST API from Convex actions (2026-02-19)
  - `src/lib/onesignal.ts` — SDK init, login/logout, permission
  - `convex/actions/sendPush.ts` — rewritten for OneSignal REST API
  - `src/components/PushNotificationManager.tsx` — auto-init in root layout

### Mobile Native Fixes
> From testing notes (2026-02-12):
- [x] Fix image upload on native (file URI handling + CORS) → Verified upload flow works correctly with base64-to-File conversion in `useCameraView` hook (2026-02-16)
- [x] Test location permissions flow after fresh install → Implemented robust permission handling via `@capacitor/geolocation` plugin with explicit check/request methods + permission status tracking (2026-02-16)
- [x] Add status bar dynamic styling (light/dark theme aware) → `use-theme.ts` dynamically calls `StatusBar.setStyle()` on theme change
- [x] Add haptic feedback on voting/saving → `useHaptics` hook + wired in `$name.tsx` (vote success/error) + `SmartCamera.tsx` (barcode detect) + `ImageUploadDialog` (barcode found)
- [x] Create native testing/debugging page → `/debug-native` route with comprehensive permission tests, camera capture test, location test, and image upload verification (2026-02-16)

### Offline Support
> Fully implemented. Service worker + offline queue + auto-sync + UI indicators all operational.
- [x] Manual service worker (`public/sw.js`) — app shell, fonts, static asset caching
- [x] Online status detection (`useOnlineStatus` hook + `OfflineBanner` component)
- [x] Offline action queue (`offline-queue.ts` via `idb-keyval` / IndexedDB)
- [x] Auto-sync on reconnect (`SyncManager` component with toast notifications)
- [x] Pending sync counter (`PendingSyncBadge` — floating badge above BottomTabs)
- [x] Wire `VotingSheet` to enqueue vote when offline + show optimistic toast → `$name.tsx` lines 108-114
- [x] Wire `ImageUploadDialog` to disable submit when offline + show warning banner

---

## 🟢 Wave 2 — Polish & Differentiation

### Community & Social
> `follows` table + `FollowButton` component exist. Community feed + product comments now live.
> Leaderboard moved from dedicated bottom tab to Profile page section.
- [x] Create public activity feed ("X rated Y as Holy Grail") → `/community` route with `getCommunityFeed` aggregating votes, products, comments
- [x] Add product comments/reviews (text, not just numeric rating) → `comments` + `commentLikes` tables, `ProductComments` component, threaded replies, like/unlike
- [x] Replace Leaderboard bottom tab → Community tab (MessageCircle icon, `/community` route)
- [x] Move Leaderboard into Profile page (collapsible section after badges)
- [x] Default home filter to "Nearby" with auto-fallback to "Recent" when empty
- [x] Configurable nearby range — settings page + quick filter dropdown (1/2/5/10/25/50 km, stored in localStorage)
- [x] Add share-to-social-media using `@capacitor/share`

### Product Detail Polish
- [x] Store freshness indicators (green <7d, yellow <30d, faded >30d)
- [x] "Near Me" badge on stores within 5km
- [x] Clickable store → open native maps (Apple Maps/Google Maps)
- [x] "Agree with Community" one-click vote (i18n)
- [x] Gamification toasts (points earned + badge unlocked after voting)
- [x] Image dimension validation (min 200×200, max 1200 with resize)

### Testing
- [ ] Add integration tests for vote cast → recalculate → average update flow
- [ ] Add integration test for anonymous → registered vote migration
- [ ] Add E2E tests for product creation + AI analysis pipeline

---

## 🔵 Wave 3 — Launch

### App Store Publishing
- [ ] Create App Store listing (iOS) — screenshots, description, keywords
- [ ] Create Play Store listing (Android)
- [ ] Write privacy policy & terms of service pages
- [ ] Submit to app stores

### Offline Support (already done in Wave 1)
- [x] Add offline status banner using `navigator.onLine` + event listeners → `OfflineBanner.tsx`
- [x] Queue votes for sync when online (optimistic updates) → `offline-queue.ts` + `SyncManager.tsx`
- [x] Service worker for PWA offline capabilities → `public/sw.js`

---

## Cross-Reference

| Document | What it covers |
|----------|---------------|
| [FUTURE_PLANS.md](./FUTURE_PLANS.md) | Items that need more research/planning before they become action items |
| [COMPETITIVE_ANALYSIS.md](./references/COMPETITIVE_ANALYSIS.md) | Feature gap analysis vs competitor apps |
| [REDESIGN_PLAN.md](./references/REDESIGN_PLAN.md) | Detailed mobile-first redesign spec (design system, file structure, architecture) |
| [MOBILE_TESTING_NOTES.md](./references/MOBILE_TESTING_NOTES.md) | Capacitor testing results and OAuth fix documentation |
| [MOBILE_APPROACH_DECISION.md](./references/MOBILE_APPROACH_DECISION.md) | ADR: why Capacitor over React Native |

---

*Last updated: 2026-02-19*
