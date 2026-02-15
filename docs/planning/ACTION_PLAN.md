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
> Camera upload + AI analysis already work. Missing: actual barcode reading + product DB lookup.
- [ ] Evaluate barcode scanning libraries (ZXing, QuaggaJS, or Capacitor community plugin)
- [ ] Add barcode reader component to `ImageUploadDialog.tsx` or new `BarcodeScanDialog.tsx`
- [ ] Integrate Open Food Facts API for barcode → product data lookup
- [ ] Create "Scan → Review → Rate → Done" flow combining barcode lookup + existing voting

### Push Notifications
> `@capacitor/share` already in package.json. FCM/APNs not set up.
- [ ] Set up Firebase Cloud Messaging (FCM) + APNs
- [ ] Store device tokens in Convex
- [ ] Implement "streak about to expire" reminder
- [ ] Implement "new product near you" alert

### Mobile Native Fixes
> From testing notes (2026-02-12):
- [ ] Fix image upload on native (file URI handling + CORS)
- [ ] Test location permissions flow after fresh install
- [ ] Add status bar dynamic styling (light/dark theme aware)
- [ ] Add haptic feedback on voting/saving (Capacitor Haptics plugin)

### Offline Support
> Service worker + offline queue infrastructure done. Need to wire into actual user flows.
- [x] Manual service worker (`public/sw.js`) — app shell, fonts, static asset caching
- [x] Online status detection (`useOnlineStatus` hook + `OfflineBanner` component)
- [x] Offline action queue (`offline-queue.ts` via `idb-keyval` / IndexedDB)
- [x] Auto-sync on reconnect (`SyncManager` component with toast notifications)
- [x] Pending sync counter (`PendingSyncBadge` — floating badge above BottomTabs)
- [ ] Wire `VotingSheet` to enqueue vote when offline + show optimistic toast
- [ ] Wire `AddProductDialog` / `ImageUploadDialog` to save draft when offline

---

## 🟢 Wave 2 — Polish & Differentiation

### Community & Social
> `follows` table + `FollowButton` component exist. Feed is personal (profile only).
- [ ] Create public activity feed ("X rated Y as Holy Grail")
- [ ] Add product comments/reviews (text, not just numeric rating)
- [ ] Add share-to-social-media using `@capacitor/share`

### Product Detail Polish
- [ ] Store freshness indicators (green <7d, yellow <30d, faded >30d)
- [ ] "Near Me" badge on stores within 5km
- [ ] Clickable store → open native maps (Apple Maps/Google Maps)
- [ ] "Agree with Community" one-click vote
- [ ] Gamification toasts (points earned + badge unlocked after voting)
- [ ] Image dimension validation (min 200×200)

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

### Offline Support
- [ ] Add offline status banner using `navigator.onLine` + event listeners
- [ ] Queue votes for sync when online (optimistic updates)
- [ ] Service worker for PWA offline capabilities

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

*Last updated: February 2026*
