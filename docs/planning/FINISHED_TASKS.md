# Finished Tasks

Any finished task goes here from the planning documents.

## ✅ Wave 0 — Mobile-First Foundation (DONE)

### Mobile-First Redesign
- ✅ Implement `BottomTabs.tsx` (Home | Leaderboard | ➕ Add | Map | Profile)
- ✅ Implement `TopBar.tsx` (logo + GPS + lang + theme + points badge + auth avatar)
- ✅ Implement `PageShell.tsx` (safe areas, padding, scroll container)
- ✅ Redesign `index.tsx` as feed-based page with filter chips (All/Recent/Nearby/Trending) + product card grid
- ✅ Add Feed ↔ Chart toggle on home page (scatter chart as alternate view)
- ✅ Add Vibe ↔ Value chart mode toggle (🛡️ Vibe / 💰 Value)
- ✅ Redesign `product/$name.tsx` for mobile (hero → rating bars → stores → voting → chart tabs)
- ✅ Redesign `profile.tsx` for mobile (user header + level bar → stats → badges → dietary → activity feed → settings)
- ✅ Adapt `login.tsx` for mobile with benefits list
- ✅ Update `__root.tsx` layout: TopBar + BottomTabs shell, PWA meta tags
- ✅ Apply Kimi design system: sage green palette, Inter font, card styles, touch targets, dark mode

### PWA Setup
- ✅ Create `public/manifest.json` (standalone, theme_color #7CB342, portrait-primary)
- ✅ Add PWA meta tags to `__root.tsx` (apple-mobile-web-app-capable, theme-color, viewport-fit=cover)
- ✅ Generate app icons (192px, 512px, maskable — SVG)
- ✅ Add service worker for app shell caching — `public/sw.js` (manual, not vite-plugin-pwa)

### Niche-Agnostic Refactor
- ✅ `MatrixChart.tsx` reads labels/colors from `appConfig.quadrants`
- ✅ `VotingPanel.tsx`, `VotingSheet.tsx` use `appConfig.quadrants` for buttons
- ✅ `ImageUploadDialog.tsx` uses `appConfig.quadrants` + `appConfig.riskConcept`
- ✅ `ProductCard.tsx`, `ProductStrip.tsx` use `appConfig.quadrants`
- ✅ `login.tsx`, `__root.tsx` use `appConfig.appName` + `appConfig.tagline`
- ✅ `globals.css` uses Kimi design tokens (sage green, charcoal, cream, slate dark)
- ✅ "gluten"/"celiac" strings only in `app-config.ts` + Convex AI prompt

### Product Detail Features
- ✅ View tabs (Average / My Vote / All Votes / Price History) — `product/$name.tsx`
- ✅ `RatingBars` component (safety, taste, price percentage bars)
- ✅ `StoreList` component with stores on product page
- ✅ `VotingSheet` mobile-optimized voting interface
- ✅ `AllVotesChart` — every vote as dot on grid
- ✅ `PriceHistoryChart` — price trend visualization
- ✅ `ShareButton` — share product
- ✅ `ReportProductDialog` — report product
- ✅ `EditProductDialog` + `DeleteProductButton` — admin edit/delete
- ✅ `VoterList` — admin voter list with impersonation
- ✅ `CoordinateGrid` — interactive 2D grid for voting
- ✅ `StoreTagInput` — store dropdown with autocomplete

### Profile Features
- ✅ User header card (avatar, name, email, level badge, XP progress bar)
- ✅ Stats grid (points, streak, votes, products, followers, following)
- ✅ `BadgeDisplay` component
- ✅ `DietaryProfileSettings` component
- ✅ Contributions/activity feed (votes + product additions)
- ✅ Settings section (location, language, theme, sign out)

### Gamification & Feed
- ✅ `ScoutCard` popover in TopBar (points + badge summary)
- ✅ `StatsCard` widgets on home page (points, streak, badges)
- ✅ Filter chips (All / Recent / Nearby / Trending) with distance-based filtering
- ✅ Search bar with clear button
- ✅ `Leaderboard` component

### Backend
- ✅ Time-decay cron (daily recalculation with exponential decay)
- ✅ Batch recalculate all products (admin mutation)
- ✅ Streak maintenance cron (2 AM UTC)
- ✅ Settings table for configurable parameters

## 🟡 Wave 1 — Remaining Table Stakes

### Barcode Scanner
- ✅ Evaluate barcode scanning libraries → `capacitor-camera-view` chosen (native overlay + auto barcode detection)
- ✅ Add barcode reader component → `SmartCamera.tsx` with `useCameraView` hook
- ✅ Integrate Open Food Facts API → `convex/barcode.ts` (`lookupBarcode` action + `findByBarcode` query)
- ✅ Create "Scan → Review → Rate → Done" flow → Wired into `ImageUploadDialog.tsx` (scan step → barcode-lookup → pre-fill form → review)

### Push Notifications
- ✅ Store device tokens in Convex → `convex/notifications.ts` (DEPRECATED — OneSignal manages tokens internally)
- ✅ Push notifications hook → `src/hooks/use-push-notifications.ts` (rewritten for OneSignal SDK)
- ✅ Implement "streak about to expire" reminder → `convex/actions/streakReminder.ts` + cron at 8 PM UTC (2026-02-16)
- ✅ Implement "new product near you" alert → `convex/actions/nearbyProduct.ts` + triggered on product creation with GPS (2026-02-16)
- ✅ Integrate OneSignal for push delivery → `onesignal-cordova-plugin` + REST API from Convex actions (2026-02-19)

### Camera Wizard — Native iOS Capture Pipeline
- ✅ Build 3-step guided capture wizard (front → ingredients → barcode) — `CameraWizard.tsx` with step indicator, shutter button, skip/cancel
- ✅ Create camera lifecycle hook — `use-camera-view.ts` with start/stop/capture/barcode, cancellation guards (`cancelledRef`)
- ✅ Integrate with ImageUploadDialog — portal rendering, modal/non-modal management, CSS transparency classes
- ✅ Create orchestration hook — `use-image-upload.ts` (wizard → processing → review → submit flow)
- ✅ Fix `FigCaptureSourceRemote err=-17281` crash — update `capacitor-camera-view` from v2.0.0 to v2.0.2+ (stop session completion callback)
- ✅ Fix camera buttons unresponsive — Radix Dialog `modal={true}` added `inert` to portaled overlay. Changed to `modal={false}` on native
- ✅ Fix dialog auto-dismiss during camera — taps on portal registered as "interact outside". Added `onInteractOutside`/`onPointerDownOutside` with `preventDefault()`
- ✅ Fix camera stuck after close — `stopCamera()` not awaited. Made finish/cancel async with `await stopCamera()` + 120ms UIKit delay
- ✅ Fix white flash on camera open — two-phase CSS: `camera-starting` (black) before dialog → `camera-running` (transparent) after native start
- ✅ Fix camera restart after submit — `resetDialog()` was setting `setStep('wizard')`. Moved to `handleOpenChange` open handler only
- ✅ Fix camera restart on error — error paths went to `setStep('wizard')`. Changed to `setStep('review')` or close dialog
- ✅ Fix orphaned camera on quick cancel — `cancelledRef` pattern in `startCamera()` checks after every async gap, aborts if unmounted
- ✅ Fix scroll behind camera dialog — `modal={false}` disables Radix scroll lock. Added manual `overflow: hidden` for non-wizard native steps
- ✅ Use `captureSample()` instead of `capture()` — grabs video frame (fast) vs full hardware pipeline (crash-prone)
- ✅ Document all lessons learned — `docs/CAMERA_WIZARD.md`, updated ARCHITECTURE.md, MOBILE_DEPLOYMENT.md, NATIVE_TESTING_GUIDE.md, copilot-instructions.md

### Mobile Native Fixes
- ✅ Fix image upload on native (file URI handling + CORS) → Verified upload flow works correctly with base64-to-File conversion in `useCameraView` hook (2026-02-16)
- ✅ Test location permissions flow after fresh install → Implemented robust permission handling via `@capacitor/geolocation` plugin with explicit check/request methods + permission status tracking (2026-02-16)
- ✅ Add status bar dynamic styling (light/dark theme aware) → `use-theme.ts` dynamically calls `StatusBar.setStyle()` on theme change
- ✅ Add haptic feedback on voting/saving → `useHaptics` hook + wired in `$name.tsx` (vote success/error) + `SmartCamera.tsx` (barcode detect) + `ImageUploadDialog` (barcode found)
- ✅ Create native testing/debugging page → `/debug-native` route with comprehensive permission tests, camera capture test, location test, and image upload verification (2026-02-16)

### Offline Support
- ✅ Manual service worker (`public/sw.js`) — app shell, fonts, static asset caching
- ✅ Online status detection (`useOnlineStatus` hook + `OfflineBanner` component)
- ✅ Offline action queue (`offline-queue.ts` via `idb-keyval` / IndexedDB)
- ✅ Auto-sync on reconnect (`SyncManager` component with toast notifications)
- ✅ Pending sync counter (`PendingSyncBadge` — floating badge above BottomTabs)
- ✅ Wire `VotingSheet` to enqueue vote when offline + show optimistic toast → `$name.tsx` lines 108-114
- ✅ Wire `ImageUploadDialog` to disable submit when offline + show warning banner
- ✅ Add offline status banner using `navigator.onLine` + event listeners → `OfflineBanner.tsx`
- ✅ Queue votes for sync when online (optimistic updates) → `offline-queue.ts` + `SyncManager.tsx`
- ✅ Service worker for PWA offline capabilities → `public/sw.js`

## 🟢 Wave 2 — Polish & Differentiation

### Community & Social
- ✅ Create public activity feed ("X rated Y as Holy Grail") → `/community` route with `getCommunityFeed` aggregating votes, products, comments
- ✅ Add product comments/reviews (text, not just numeric rating) → `comments` + `commentLikes` tables, `ProductComments` component, threaded replies, like/unlike
- ✅ Replace Leaderboard bottom tab → Community tab (MessageCircle icon, `/community` route)
- ✅ Move Leaderboard into Profile page (collapsible section after badges)
- ✅ Default home filter to "Nearby" with auto-fallback to "Recent" when empty
- ✅ Configurable nearby range — settings page + quick filter dropdown (1/2/5/10/25/50 km, stored in localStorage)
- ✅ Add share-to-social-media using `@capacitor/share`

### Product Detail Polish
- ✅ Store freshness indicators (green <7d, yellow <30d, faded >30d)
- ✅ "Near Me" badge on stores within 5km
- ✅ Clickable store → open native maps (Apple Maps/Google Maps)
- ✅ "Agree with Community" one-click vote (i18n)
- ✅ Gamification toasts (points earned + badge unlocked after voting)
- ✅ Image dimension validation (min 200×200, max 1200 with resize)

### Profile Page — iOS UI/UX Complete
- ✅ Collapsible sections with `CollapsibleSection` reusable component (Framer Motion animated expand/collapse)
- ✅ Section order: My Stats → Recent Activity → Dietary Preferences → Settings → Leaderboard → Badges
- ✅ Preview info on each collapsed section (stat badges, recent activity, dietary emojis, location/range, leaderboard #1, badge count)
- ✅ Scroll-to-top on open (via `onAnimationComplete` callback, safe-area-aware `scrollMarginTop`)
- ✅ Scroll-up compensation on close (measures body height, caps at usable viewport)
- ✅ Flexible bottom spacer (flexbox `min-height` approach, no hardcoded padding)
- ✅ `hideHeader` prop on BadgeDisplay, Leaderboard, DietaryProfileSettings to avoid double Card wrappers
- ✅ All sections translated (en.json + hu.json)

### Backend Patterns
- ✅ Reusable Auth Middlewares (`convex-helpers`)
- ✅ O(log n) Aggregates (`@convex-dev/aggregate`)
- ✅ Trigger-Like Side Effects (`convex/sideEffects.ts`)
