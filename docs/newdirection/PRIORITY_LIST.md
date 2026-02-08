# Complete Weighted Priority List

> Every planned feature across all waves, scored and ordered by launch priority.
> Cross-referenced with `docs/FEATURE_GAP_ANALYSIS.md` and Kimi design specs.

## Progress Tracking

**How to use this list:**
- Each task has a checkbox: `[ ]` = not started, `[x]` = done.
- Before starting a sprint, review all unchecked items in order.
- After completing a task, immediately check it off (`[x]`).
- If a task **cannot be completed as described**, do NOT skip it silently — update this document with a note explaining why, and either revise the task or move it to a later wave.
- Wave N+1 should not begin until all items in Wave N are checked (or explicitly replanned).
- This file is the **single source of truth** for what's done and what's next.

## Scoring System

Each item is scored on three axes (1–5 scale):

| Axis | Meaning |
|------|---------|
| **First-Impression Impact (I)** | How much does a new user notice this in the first 5 minutes? |
| **Functional Necessity (N)** | Is the app broken, confusing, or noticeably incomplete without it? |
| **Effort (E)** | S=1 · M=2 · L=3 (lower effort → higher score contribution) |

**Priority Score** = `(I × 2 + N × 3) / E`

Higher score = do sooner. Within each sprint, items are ordered by **implementation dependency** (what must be built first), not strictly by score. Scores indicate relative importance for prioritization decisions.

---

## Wave 0: Foundation

All items are prerequisites — everything in Wave 1+ depends on them. No scoring needed; they're all mandatory and must be completed in order.

### Sprint 0a: Config Layer

Creates `src/lib/app-config.ts` and removes all hardcoded niche strings from components.

| | Step | Task | Files Affected | Verification |
|---|------|------|----------------|-------------|
| [x] | 1 | Create `src/lib/app-config.ts` with full structure: `appName`, `categoryTerm`, `tagline`, `dimensions` (axis1/axis2/axis3 with keys, labels, presets), `quadrants` (4 entries with id/label/emoji/color), `valueLens` (optional 2nd chart mode), `ratingLabels` (thresholds), `riskConcept`, `certificationName`, `storeDefaults` (per country), `colors` | New file | File exists and TypeScript compiles |
| [x] | 2 | Refactor `src/lib/types.ts` — `QUADRANTS` record reads labels/descriptions from `appConfig.quadrants`. `SAFETY_PRESETS`, `TASTE_PRESETS` read from `appConfig.dimensions.axis1.presets` / `axis2.presets`. `PRICE_LABELS` reads from config. `getQuadrant()` logic stays (it's generic threshold math) | `types.ts` | Types still export correctly, no inline niche strings |
| [x] | 3 | Refactor `VotingPanel.tsx` — Replace line 30 `"How safe is it for celiacs?"` with i18n key referencing `appConfig.dimensions.axis1.label`. Preset labels from config | `VotingPanel.tsx` | No grep hits for "celiac" |
| [x] | 4 | Refactor `FineTunePanel.tsx` — Replace line 49 `"Safety for Celiacs"` with `appConfig.dimensions.axis1.label` | `FineTunePanel.tsx` | No grep hits for "celiac" |
| [x] | 5 | Refactor `MatrixChart.tsx` — Axis labels and quadrant corner labels read from config | `MatrixChart.tsx` | No hardcoded "Safety"/"Taste"/"Holy Grail" (verify chart still renders) |
| [x] | 6 | Refactor `ProductCard.tsx` — "Safety: X • Taste: X" uses config dimension labels | `ProductCard.tsx` | No inline "Safety"/"Taste" strings |
| [x] | 7 | Refactor `AddProductDialog.tsx` — Line 95 description + line 107 placeholder use config `categoryTerm` and generic example | `AddProductDialog.tsx` | No "gluten" in file |
| [x] | 8 | Refactor `EditProductDialog.tsx` — Line 110 placeholder uses generic example | `EditProductDialog.tsx` | No "Gluten-Free" in file |
| [x] | 9 | Refactor `ImageUploadDialog.tsx` — Line 42 `containsGluten` → `containsRiskIngredient` (or config-keyed field). Lines 304-306 warning reads from config `riskConcept` | `ImageUploadDialog.tsx` | No "gluten" in file (except locale key reference) |
| [x] | 10 | Refactor `__root.tsx` — Lines 33-34 meta title/description from `appConfig.appName` + `appConfig.tagline` | `__root.tsx` | Meta tags reference config |
| [x] | 11 | Refactor `login.tsx` — Line 68 tagline from config | `login.tsx` | No "gluten" or "celiac" |
| [x] | 12 | **Verification gate**: `grep -ri "gluten\|celiac\|Holy Grail" src/ --include="*.tsx" --include="*.ts"` returns hits ONLY in `app-config.ts` and `locales/*.json` | — | Clean grep |

### Sprint 0b: Design Tokens + PWA

| | Step | Task | Verification |
|---|------|------|-------------|
| [x] | 1 | Add Kimi color palette as CSS custom properties in `globals.css`: `--color-primary: #7CB342`, `--color-primary-dark: #558B2F`, `--color-primary-light: #AED581`, `--color-bg: #FAF8F5`, `--color-text: #2D3436`, `--color-text-secondary: #636E72`, `--color-border: #B2BEC3`, `--color-safety-high: #27AE60`, `--color-safety-mid: #F39C12`, `--color-safety-low: #E74C3C`, `--color-gold: #F1C40F`. Dark mode: `--color-bg-dark: #0F172A`, `--color-surface-dark: #1E293B` | CSS loads, colors visible |
| [x] | 2 | Update shadcn theme to map `--primary`, `--background`, `--foreground`, `--muted`, etc. to new Kimi tokens | shadcn components use new palette |
| [x] | 3 | Add Inter font: `<link>` to Google Fonts in `__root.tsx` head, set `font-family: 'Inter', system-ui, -apple-system, sans-serif` as body default | Font loads on page |
| [x] | 4 | Create `public/manifest.json` — `name: "G-Matrix"`, `short_name: "G-Matrix"`, `start_url: "/"`, `display: "standalone"`, `theme_color: "#7CB342"`, `background_color: "#FAF8F5"`, `icons: [...]` | Manifest loads in DevTools > Application |
| [x] | 5 | Create app icons: `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (can be placeholder squares initially) | Icons referenced in manifest |
| [x] | 6 | Add PWA meta tags to `__root.tsx` head: `<meta name="apple-mobile-web-app-capable" content="yes">`, `<meta name="theme-color" content="#7CB342">`, `<link rel="manifest" href="/manifest.json">`, updated viewport: `width=device-width, initial-scale=1, viewport-fit=cover` | "Add to Home Screen" prompt available on mobile |

### Sprint 0c: Capacitor Shell

| | Step | Task | Verification |
|---|------|------|-------------|
| [x] | 1 | `npm install @capacitor/core @capacitor/cli` | Packages in `package.json` |
| [x] | 2 | `npx cap init "G-Matrix" "com.gmatrix.app" --web-dir dist/client` → creates `capacitor.config.ts` | Config file created |
| [x] | 3 | `npx cap add ios && npx cap add android` | `ios/` and `android/` folders created |
| [x] | 4 | Add to `package.json` scripts: `"cap:sync": "npx cap sync"`, `"cap:ios": "npx cap open ios"`, `"cap:android": "npx cap open android"` | Scripts work |
| [x] | 5 | `npm install @capacitor/geolocation @capacitor/camera @capacitor/share` | Packages installed |
| [x] | 6 | Create `src/lib/platform.ts` — export `isNative()`, `isIOS()`, `isAndroid()`, `isWeb()` using Capacitor's `Capacitor.isNativePlatform()` and `Capacitor.getPlatform()` | Can detect platform at runtime |
| [x] | 7 | Add `ios/` and `android/` to `.gitignore` (native build artifacts; regenerated from config) | Clean git status |
| [x] | 8 | Verify: `npm run build && npx cap sync && npx cap open ios` opens app in Xcode simulator | App renders in simulator |

### Sprint 0d: Agent Guidelines

| | Step | Task |
|---|------|------|
| [x] | 1 | Create `.github/copilot-instructions.md` (see separate file) |

---

## Wave 1: Layout Overhaul

Broken into 6 sub-sprints. Each sprint produces a testable increment.

### Sprint 1a: Navigation

| | Priority | I | N | E | Score | Task | Details |
|---|----------|---|---|---|-------|------|---------|
| [ ] | 1 | 5 | 5 | S | 25.0 | **Create TopBar** | `src/components/layout/TopBar.tsx` — Logo/app name (left), auth avatar or "Sign In" button (right). Minimal height (~48px). Transparent or cream background |
| [ ] | 2 | 5 | 5 | M | 12.5 | **Create BottomTabs** | `src/components/layout/BottomTabs.tsx` — 4 tabs: Home (grid icon), Map (map-pin icon), ➕ Add (plus-circle), Profile (user icon). Active = sage green, inactive = gray. Fixed bottom, `pb-safe` (iOS safe area). ➕ button opens `AddProductDialog` or `ImageUploadDialog` |
| [ ] | 3 | 3 | 5 | M | 10.5 | **Update root layout** | `src/routes/__root.tsx` — Replace `<Navigation>` import with `<TopBar>` above `<Outlet>` and `<BottomTabs>` below. Add bottom padding to body for tab bar height. Move Toaster from `bottom-right` to `top-center` (less likely to overlap bottom tabs on mobile) |
| [ ] | 4 | 2 | 3 | S | 13.0 | **Create PageShell** | `src/components/layout/PageShell.tsx` — Common page wrapper: max-width container, horizontal padding (16px mobile, 24px tablet), top padding for TopBar, bottom padding for BottomTabs. All route pages use this |
| [ ] | 5 | 1 | 2 | S | 8.0 | **Archive old Navigation** | Remove or rename `src/components/Navigation.tsx` to `Navigation.old.tsx`. Remove all imports from routes |

### Sprint 1b: Product Card + Home Feed

| | Priority | I | N | E | Score | Task | Details |
|---|----------|---|---|---|-------|------|---------|
| [ ] | 1 | 5 | 5 | M | 12.5 | **Create new ProductCard** | `src/components/feed/ProductCard.tsx` — Safety dots row (3 × 8px circles: axis1/axis2/axis3 scores → green/yellow/red/gray). Square product image (rounded 12px). Product name (H3, 1-line truncate). Distance from user if GPS available. Quadrant badge pill. White card, 16px radius, shadow. Taps → `/product/$name` |
| [ ] | 2 | 5 | 5 | L | 8.3 | **Rewrite home page** | `src/routes/index.tsx` — Search bar (top), FilterChips row below, FeedGrid of ProductCards. Top-right corner: Feed/Chart toggle icon button. When "Chart" active, show existing `MatrixChart` + `Leaderboard` sidebar (desktop) or full-width (mobile). Default = feed view |
| [ ] | 3 | 4 | 4 | S | 20.0 | **Create FilterChips** | `src/components/feed/FilterChips.tsx` — Horizontal scroll container: All \| Recently Added \| Nearby \| Trending. Pill shape, 24px radius. Active = sage green bg/white text. Single-select (one active at a time) |
| [ ] | 4 | 3 | 3 | S | 15.0 | **Create FeedGrid** | `src/components/feed/FeedGrid.tsx` — `grid grid-cols-2 gap-3` on mobile, `grid-cols-3` on tablet, `grid-cols-4` on desktop. Accepts children. Handles empty state ("No products found") |
| [ ] | 5 | 3 | 3 | S | 15.0 | **Implement filter logic** | In home page: `All` = default sort by `lastUpdated` desc. `Recently Added` = sort by `_creationTime` desc. `Trending` = sort by `totalVotes` desc. `Nearby` = filter to products with stores ≤5km (depends on GPS — graceful degradation if denied) |

### Sprint 1c: Product Detail Page

| | Priority | I | N | E | Score | Task | Details |
|---|----------|---|---|---|-------|------|---------|
| [ ] | 1 | 5 | 5 | L | 8.3 | **Rewrite product detail** | `src/routes/product/$name.tsx` — Hero image (full-width, 300px max height). Product name + quadrant badge. Rating bars section. Stores section. Voting section (VotingSheet). Ingredients section. Back button (top-left arrow). All sections in vertical scroll |
| [ ] | 2 | 4 | 4 | M | 10.0 | **Create RatingBars** | `src/components/product/RatingBars.tsx` — 3 horizontal bars: axis1 (safety), axis2 (taste), axis3 (price). Each bar: label (from config) + score value + colored progress bar (green ≥60, yellow 40-59, red <40) + rating label text ("Excellent"/"Good"/"Fair"/"Poor" from config thresholds). 8px bar height, rounded, animated width on mount |
| [ ] | 3 | 4 | 4 | M | 10.0 | **Create StoreList** | `src/components/product/StoreList.tsx` — Card listing stores from `product.stores[]`: store name, price ($ icons), last seen (relative time via `formatRelativeTime()`), user distance if GPS available, freshness border (green <7d, yellow <30d, faded >30d). Tap store → open maps (platform-aware URL) |
| [ ] | 4 | 3 | 3 | S | 15.0 | **Add price display** | Average price shown as $ icon row or "Budget"/"Moderate"/"Expensive" label. `avgPrice` field exists in schema. Price labels from config |
| [ ] | 5 | 3 | 2 | S | 12.0 | **Show ingredients to all** | Currently ingredients show admin-only. Make visible to all users on product detail (read-only tag list) |

### Sprint 1d: Voting UX

| | Priority | I | N | E | Score | Task | Details |
|---|----------|---|---|---|-------|------|---------|
| [ ] | 1 | 5 | 5 | M | 12.5 | **Create VotingSheet** | `src/components/product/VotingSheet.tsx` — Mobile-optimized voting UI replacing `VotingPanel.tsx`. Full-width safety buttons (3: Clean/Sketchy/Wrecked from config), full-width taste buttons (3: Yass!/Meh/Pass from config), combo presets row (4: Holy Grail/Survivor/Risky/Bin). All labels from `appConfig`. 48px min button height |
| [ ] | 2 | 4 | 4 | S | 20.0 | **Add price vote buttons** | 5 pill buttons ($–$$$$$) in VotingSheet. Backend `votes.cast` already accepts `price` param. Schema field exists. This is purely frontend |
| [ ] | 3 | 4 | 3 | M | 8.5 | **Redesign FineTunePanel** | Mobile-friendly sliders with larger thumb (24px), value display. Axis labels from config. Expandable/collapsible after quick vote |
| [ ] | 4 | 3 | 3 | M | 7.5 | **Create store dropdown** | Upgrade `StoreTagInput.tsx` — Radix Select or custom dropdown: predefined stores from `appConfig.storeDefaults[userLocale]` + "Add custom store..." option at bottom → free text input. GPS button stays |
| [ ] | 5 | 3 | 2 | S | 12.0 | **Gamification toasts** | After `votes.cast` mutation returns, show: `"+${points} Scout Points! 🎉"` (Sonner toast). If badge unlocked, show: `"🏆 Badge Unlocked: ${badge.name}!"`. Data from existing `calculateVotePoints()` and badge check in `profiles.ts` |

### Sprint 1e: Map Page

| | Priority | I | N | E | Score | Task | Details |
|---|----------|---|---|---|-------|------|---------|
| [ ] | 1 | 4 | 4 | L | 6.7 | **Create map route** | `src/routes/map.tsx` — Install `leaflet` + `react-leaflet`. Full-height map (minus TopBar and BottomTabs). OpenStreetMap tiles. Initial center: user GPS position or Budapest fallback `[47.497, 19.040]` |
| [ ] | 2 | 4 | 4 | M | 10.0 | **Create ProductMap** | `src/components/map/ProductMap.tsx` — Reusable Leaflet `MapContainer`. Accepts `products` array. Renders markers at each `product.stores[].geoPoint`. Marker color = quadrant color. Clusters for dense areas (optional, use `react-leaflet-cluster`) |
| [ ] | 3 | 3 | 3 | M | 7.5 | **Create ProductPin** | `src/components/map/ProductPin.tsx` — Marker popup: product image thumbnail (48px), name, safety dots, vote count, "View →" link to `/product/$name` |
| [ ] | 4 | 2 | 2 | S | 10.0 | **Map filter chips** | Reuse `FilterChips` component on map page: Nearby (distance sort), High Safety, Low Price, Recently Added |

### Sprint 1f: Profile + Global Polish

| | Priority | I | N | E | Score | Task | Details |
|---|----------|---|---|---|-------|------|---------|
| [ ] | 1 | 4 | 3 | M | 8.5 | **Redesign profile page** | `src/routes/profile.tsx` — User header: avatar (64px), name, level title (from config: "Bronze Scout" / "Silver Scout" / "Gold Scout" / "Elite Scout"), progress bar (XP toward next level). Stats row: points \| day streak \| products added (reuse `StatsCard`). Badges grid (reuse `BadgeDisplay`). Contributions feed: chronological list of recent actions with points earned |
| [ ] | 2 | 3 | 2 | S | 12.0 | **Level progress bar** | Config-driven level thresholds: Bronze 0-249, Silver 250-499, Gold 500-999, Elite 1000+. Progress bar shows % within current level. Add to `app-config.ts` levels |
| [ ] | 3 | 2 | 2 | S | 10.0 | **Adapt remaining pages** | `admin.tsx`, `leaderboard.tsx`, `login.tsx` — Apply new design tokens (sage green, cream bg, Inter font, card styles). No layout rewrite needed, just visual consistency |
| [ ] | 4 | 3 | 3 | M | 7.5 | **Mobile responsiveness pass** | Test all pages at 375px, 390px, 428px widths. Fix overflow, truncation, touch-target violations. Verify BottomTabs doesn't overlap content. Test iOS Safari safe areas |

---

## Wave 2: Must-Have Features

These make the app feel "fully working" — missing any of these makes the app feel incomplete for a new user.

| Rank | I | N | E | Score | Feature | Details | Gap Ref |
|------|---|---|---|-------|---------|---------|---------|
| 1 | 5 | 5 | M | 12.5 | **"Near Me" GPS filter** on home feed | When "Nearby" filter chip active, filter products to those with at least one store ≤5km from user. Uses existing `useGeolocation()` hook + `calculateDistance()` from utils. Graceful fallback: if GPS denied, show toast "Enable location to see nearby products" and disable chip | Gap 3.3, 8.3 |
| 2 | 3 | 3 | S | 15.0 | **Client-side image resize + WebP** | Before uploading product image, resize to max 1024×1024px and convert to WebP at 80% quality using Canvas API. Reduces upload size ~5-10× on mobile (critical for cellular). Apply in `ImageUploadDialog.tsx` before `storage.generateUploadUrl()` | Gap 5.7 |
| 3 | 3 | 2 | S | 12.0 | **"Near Me" badge on stores** | In `StoreList.tsx`, stores within 5km show green "📍 Nearby" pill badge. Uses existing Haversine `calculateDistance()` + `useGeolocation()` position | Gap 4.9, 8.4 |
| 4 | 3 | 2 | S | 12.0 | **Store freshness UI** | In `StoreList.tsx`, store entry border/indicator: green (<7 days old), yellow (7-30 days), faded/gray (>30 days). Based on `store.lastSeenAt` vs. `Date.now()`. CSS only | Gap 4.8 |
| 5 | 3 | 2 | S | 12.0 | **Clickable store → maps** | Tap store entry → open in native maps. Platform detection: `maps://` for iOS (Capacitor or Safari), `geo:` intent for Android, `https://maps.google.com/?q=lat,lng` for desktop web | Gap 4.10, 8.6 |
| 6 | 3 | 2 | S | 12.0 | **"Agree with Community" vote** | Button in VotingSheet: "Agree with Community 👍" — casts vote with current community average values (reads `product.averageSafety` + `product.averageTaste`). One click, maximum convenience | Gap 2.13 |
| 7 | 2 | 2 | S | 10.0 | **Rating labels** | Next to each score on product detail: "Excellent" (≥80), "Good" (≥60), "Fair" (≥40), "Poor" (<40). Thresholds and labels from `appConfig.ratingLabels`. Small colored text next to percentage | Gap 4.5 |
| 8 | 2 | 1 | S | 7.0 | **Level progress bar on profile** | XP progress within current level. Level thresholds from config. Circular or linear progress indicator on profile page header | Gap 7.6 |

---

## Wave 3: Visual Polish

Makes the first impression "attractive" beyond functional.

| Rank | I | N | E | Score | Feature | Details | Gap Ref |
|------|---|---|---|-------|---------|---------|---------|
| 1 | 4 | 1 | S | 11.0 | **Micro-animations** | Button press: `scale(0.97)` spring. Card tap: `translateY(-2px)` + shadow. Filter chip: bg-color 200ms. Rating bars: width animate on mount. Use Framer Motion `whileTap`, `whileHover`, `initial`/`animate` | Kimi spec |
| 2 | 2 | 1 | S | 7.0 | **Product-hash colors** | On scatter chart, each product dot gets a consistent color based on name hash. 11-color palette. `hashStringToColor(name)` utility | Gap 1.9 |
| 3 | 2 | 1 | S | 7.0 | **ScoutCard popover** | Points badge in TopBar (if signed in) → popover showing: total points, current level, streak, badge count. Quick gamification glance from any page | Gap 7.5 |
| 4 | 2 | 1 | S | 7.0 | **Location status icon** | In TopBar: map pin icon — green (GPS enabled), red (denied), gray (not requested). Tap → requests permission | Gap 8.5 |
| 5 | 2 | 1 | S | 7.0 | **Chart ↔ list sync** | When chart dot clicked, scroll product into view in feed list (and vice versa). `scrollIntoView({ behavior: 'smooth' })` with ref tracking | Gap 10.9 |
| 6 | 3 | 2 | M | 6.0 | **Chart mode switcher** | On chart toggle view: "Vibe" (safety vs taste) ↔ "Value" (price vs taste) toggle. Value-mode quadrant names ("Treat", "Rip-Off", "The Steal", "Cheap Filler") and dollar sign Y-axis from `appConfig.valueLens` | Gap 1.2, 1.3, 1.6, 1.7 |
| 7 | 3 | 1 | M | 4.5 | **Dark mode** | CSS custom properties switch to Kimi dark palette (Deep Navy bg, Slate surfaces, Soft Amber accents). Toggle in settings or system preference. Tailwind `dark:` classes + `prefers-color-scheme` | Kimi spec |

---

## Wave 4: Post-Launch

Iterate based on real user feedback. Not required for public launch. Ordered by estimated user value.

| | Rank | Feature | Effort | Category | Gap Ref | Notes |
|---|------|---------|--------|----------|---------|-------|
| [ ] | 1 | **View tabs** on product detail (Average / My Vote / All Votes) | M | Voting UX | 2.16 | Shows different chart perspectives — requires querying individual votes |
| [ ] | 2 | **All Votes visualization** (individual vote dots on chart) | M | Visualization | 1.13, 1.14, 1.15 | Color-coded: green=registered, gray=anonymous, gold=impersonated |
| [ ] | 3 | **Time-decay cron** + recalculation system | M | Data Quality | 9.1, 9.2 | Convex cron: 0.5%/day decay on averages. Keeps ratings fresh, downweights stale votes |
| [ ] | 4 | **Social sharing** (native share sheet) | S | Growth | Kimi | Capacitor Share plugin on native, Web Share API on browser. Share product link + name + rating |
| [ ] | 5 | **Full map bottom-sheet** UX | L | Map UX | Kimi | Swipeable bottom sheet over map with product cards. Horizontal scroll. Spring animations |
| [ ] | 6 | **Camera/barcode scan** | L | Product Creation | Kimi | Capacitor Camera plugin → capture → AI analysis. Barcode → Open Food Facts API lookup. Full scan flow |
| [ ] | 7 | **Admin voter list** with delete/impersonate per vote | M | Admin | 4.12, 4.13, 4.14, 6.8, 6.9 | Scrollable voter list on product detail (admin only). Eye icon = impersonate, trash = delete vote |
| [ ] | 8 | **Community store verification** → promoted to defaults | M | Stores | New | Stores added by 5+ users get flagged as verified. Admin can promote to `storeDefaults` |
| [ ] | 9 | **Push notifications** | M | Engagement | Kimi | Capacitor Push plugin. Streak reminders, price drops, nearby new products. Requires push server |
| [ ] | 10 | **Drag-and-drop image upload** | S | Upload UX | 5.10 | Drop zone in ImageUploadDialog. `onDragOver`/`onDrop` handlers |
| [ ] | 11 | **Report Product button** | S | Moderation | 2.18 | Flag icon on product detail. Creates report entry. Admin sees reports in dashboard |
| [ ] | 12 | **Store profiles page** | M | Discovery | Kimi | `/store/$name` route — all products at a given store. Store safety rating. User-submitted store photos |
| [ ] | 13 | **Price tracking history** | M | Price UX | Kimi | Line chart of price over time per product. Requires storing historical price data (new schema field) |
| [ ] | 14 | **Dietary profiles** | M | Personalization | Kimi | User sets: Celiac / Gluten-sensitive / Preference. Safety ratings weighted by profile. UI toggle on profile page |
| [ ] | 15 | **Community challenges** | M | Gamification | Kimi | Weekly goals ("Add 5 products → Explorer Badge"). Admin-configured challenge definitions. Leaderboard integration |
| [ ] | 16 | **Follow power users** | S | Social | Kimi | Follow button on profiles. Feed filter "From People I Follow" |
| [ ] | 17 | **Offline mode** | L | Resilience | Kimi | Service worker caches product data for user's area. Queue votes offline → sync on reconnect. Critical for traveling |
| [ ] | 18 | **Smart notifications** | M | Engagement | Kimi | "Product you rated available closer!", "New bakery near you", "Streak about to break!" |
| [ ] | 19 | **Ad slot placeholder** | S | Business | 10.10 | Component placeholder for future sponsored content / affiliate links |
| [ ] | 20 | **Full template CLI** | L | Platform | Kimi | `npx create-matrix-app` — scaffolds new niche app from config. Full extraction of template pattern |

---

## Cross-Reference: Gap Analysis → Wave Assignment

Every item from `docs/FEATURE_GAP_ANALYSIS.md` is accounted for:

| Gap # | Feature | Status | Wave | Item |
|-------|---------|--------|------|------|
| 1.2 | Price vs Taste chart (Value Lens) | ❌ → Planned | W3 | 3.2 |
| 1.3 | Chart mode switcher | ❌ → Planned | W3 | 3.2 |
| 1.6 | Value-mode quadrant names | ❌ → Planned | W3 | 3.6 (part of chart mode switcher) |
| 1.7 | Dollar sign Y-axis in value mode | ❌ → Planned | W3 | 3.6 (part of chart mode switcher) |
| 1.9 | Consistent hash colors | 🟡 → Planned | W3 | 3.2 |
| 1.12 | ProductVibeChart overlay | 🟡 → Adequate | — | Current `CoordinateGrid` serves same purpose; no change needed |
| 1.13 | All Votes visualization | ❌ → Planned | W4 | 4.2 |
| 1.14 | My Vote dot | ❌ → Planned | W4 | 4.1 (part of view tabs) |
| 1.15 | Color-coded vote dots | ❌ → Planned | W4 | 4.2 |
| 2.6 | 5-level price vote UI | ❌ → Planned | W1 | Sprint 1d #2 |
| 2.7 | Predefined store dropdown | 🟡 → Planned | W1 | Sprint 1d #4 |
| 2.13 | Agree with Community | ❌ → Planned | W2 | 2.6 |
| 2.16 | View tabs (Avg/My/All) | ❌ → Planned | W4 | 4.1 |
| 2.17 | Gamification toasts | 🟡 → Planned | W1 | Sprint 1d #5 |
| 2.18 | Report Product | ❌ → Planned | W4 | 4.11 |
| 3.2 | Quadrant quick-filter (chart dots) | ❌ → Deferred | W4 | Feed FilterChips serve a different purpose (recency/proximity). Chart-specific quadrant toggle can be added later if chart view gets heavy use |
| 3.3 | "Near Me" GPS filter | ❌ → Planned | W2 | 2.1 |
| 3.4 | Combined filter logic (search + filters AND) | ❌ → Planned | W1 | Sprint 1b #5 (filters are composable: search text AND active filter chip) |
| 4.2 | Back image display | ❌ → Planned | W4 | 4.10 (part of enhanced image features) |
| 4.5 | Rating labels | ❌ → Planned | W2 | 2.7 |
| 4.6 | Price display | ❌ → Planned | W1 | Sprint 1c #4 |
| 4.7 | Stores list card | ❌ → Planned | W1 | Sprint 1c #3 |
| 4.8 | Store freshness | ❌ → Planned | W2 | 2.4 |
| 4.9 | Near Me badge stores | ❌ → Planned | W2 | 2.3 |
| 4.10 | Store → native maps | ❌ → Planned | W2 | 2.5 |
| 4.11 | Ingredients visible to all | 🟡 → Planned | W1 | Sprint 1c #5 |
| 4.12 | Admin voter list (full, with actions) | 🟡 → Planned | W4 | 4.7 |
| 4.13 | Per-vote delete (admin) | ❌ → Planned | W4 | 4.7 |
| 4.14 | Per-vote impersonate (admin) | ❌ → Planned | W4 | 4.7 |
| 5.7 | Image resize + WebP | ❌ → Planned | W2 | 2.2 |
| 5.8 | Image dimension validation (min 200×200) | ❌ → Planned | W2 | 2.2 (part of client-side image processing) |
| 5.10 | Drag-and-drop upload | ❌ → Planned | W4 | 4.10 |
| 5.13 | Vibe-Check flow (post-scan page) | 🟡 → Deferred | W4 | Current dialog flow is simpler and works. Revisit if camera/barcode scanning (W4 4.6) justifies a multi-step flow |
| 5.14 | Unnamed product naming (fallback) | 🟡 → Adequate | — | Current manual-entry fallback covers this use case |
| 7.4 | Gamification toasts (specific) | ❌ → Planned | W1 | Sprint 1d #5 |
| 7.5 | ScoutCard popover | 🟡 → Planned | W3 | 3.5 |
| 7.6 | Level progress bar | ❌ → Planned | W2 | 2.8 |
| 8.3 | Near Me filter | ❌ → Planned | W2 | 2.1 |
| 8.4 | Near Me badge on stores | ❌ → Planned | W2 | 2.3 (same as 4.9) |
| 8.5 | Location status icon | ❌ → Planned | W3 | 3.4 |
| 8.6 | Clickable store → native maps | ❌ → Planned | W2 | 2.5 (same as 4.10) |
| 8.9 | Store freshness list with GPS badges | ❌ → Planned | W1+W2 | Covered by Sprint 1c #3 (StoreList) + W2 items 2.3, 2.4 |
| 9.1 | Time-decay cron | ❌ → Planned | W4 | 4.3 |
| 9.2 | Time-decay recalc | ❌ → Planned | W4 | 4.3 |
| 9.3 | Migrations framework | ❌ → Deferred | — | Only if schema changes warrant migration tooling |
| 9.4 | Sharded counter | ❌ → Deferred | — | Only needed at high concurrency scale |
| 6.6 | Per-product time-decay recalculate | ❌ → Planned | W4 | 4.3 (part of time-decay system) |
| 6.7 | Batch recalculate all products | ❌ → Planned | W4 | 4.3 (part of time-decay system) |
| 6.8 | Per-vote admin delete on product page | ❌ → Planned | W4 | 4.7 (part of admin voter list) |
| 6.9 | Admin voter list with impersonate | ❌ → Planned | W4 | 4.7 (part of admin voter list) |
| 10.3 | Context-aware nav | 🟡 → Superseded | W1 | BottomTabs replaces context-aware top nav; fixed tabs are clearer |
| 10.9 | Chart ↔ list sync | 🟡 → Planned | W3 | 3.7 |
| 10.10 | Ad slot placeholder | ❌ → Planned | W4 | 4.19 |

**New features from Kimi design (not in original gap analysis):**

| Feature | Wave | Item |
|---------|------|------|
| Bottom tab navigation | W1 | Sprint 1a |
| Feed-based home screen | W1 | Sprint 1b |
| Safety dots on product cards | W1 | Sprint 1b |
| Map page with Leaflet | W1 | Sprint 1e |
| PWA manifest + installability | W0 | Sprint 0b |
| Capacitor native wrapper | W0 | Sprint 0c |
| Platform detection utility | W0 | Sprint 0c |
| Rating bars on product detail | W1 | Sprint 1c |
| Niche config extraction | W0 | Sprint 0a |
| Design token overhaul | W0 | Sprint 0b |
| Camera/barcode scan | W4 | 4.6 |
| Store profiles page | W4 | 4.12 |
| Community challenges | W4 | 4.15 |
| Dietary profiles | W4 | 4.14 |
| Offline mode | W4 | 4.17 |
| Smart notifications | W4 | 4.18 |
| Full template CLI | W4 | 4.20 |

---

## Estimated Timeline

| Wave | Focus | Effort | Depends On | Release Gate? |
|------|-------|--------|------------|---------------|
| **Wave 0** | Foundation (config + tokens + PWA + Capacitor + agent) | ~3-4 days | Nothing | No |
| **Wave 1** | Layout overhaul (6 sub-sprints) | ~10-14 days | Wave 0 | No |
| **Wave 2** | Must-have features (8 items) | ~4-5 days | Wave 1 | **Yes — launch-ready after Wave 2** |
| **Wave 3** | Visual polish (7 items) | ~3-4 days | Wave 1 | Optional before launch |
| **Wave 4** | Post-launch iteration (20 items) | Ongoing | Live user feedback | Continuous |

**Total to public launch: ~20-25 days** (solo developer with LLM assistance)

Waves 2 and 3 can run in parallel — polish items don't block feature work.

---

*This is the complete feature inventory. Every item from the gap analysis (109 items), Kimi design specs, and new requirements is accounted for — assigned to a wave, marked adequate as-is, or explicitly deferred with rationale.*
