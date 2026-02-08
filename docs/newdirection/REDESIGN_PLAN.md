# G-Matrix Redesign: Mobile-First Community Product Platform

## Purpose

G-Matrix is being redesigned from a desktop-centric scatter-chart app into a **mobile-first community product discovery platform**. The current codebase works — voting, gamification, AI analysis, auth, SSR deployment are all functional — but the UI was built for desktop screens with the scatter chart as the centerpiece. The new direction puts the **product feed** first, the **map** second, and the **chart as a toggle view** — optimized for phones, installable as a PWA, and wrappable with Capacitor for app stores.

At the same time, the codebase must become **niche-agnostic**: one config file swap should turn G-Matrix (gluten-free) into V-Matrix (vegan), K-Matrix (keto), or any community product rating app. This means extracting all hardcoded niche terminology into a central config and keeping components composable.

The goal is **public release ASAP** with an attractive, fully working first impression — then iterate with real user feedback.

---

## Goals

### 1. Mobile-First PWA + Capacitor-Ready
- Design for 375px screens first; desktop is progressive enhancement
- Bottom tab navigation (Home | Map | ➕ Add | Profile)
- PWA manifest for "Add to Home Screen" installability
- Capacitor shell for iOS/Android app store distribution
- Touch-optimized interactions (44px min targets, swipe gestures)

### 2. Feed-Based Discovery
- Replace the scatter chart homepage with a scrollable product card grid
- Filter chips: All | Recently Added | Nearby | Trending
- Scatter chart survives as a **toggle view** on the home screen (Feed ↔ Chart)
- Search bar prominent at top

### 3. Niche-Agnostic Architecture
- All niche-specific terms (dimension labels, quadrant names, store defaults, app name, colors) live in ONE config file: `src/lib/app-config.ts`
- Components never import hardcoded niche strings — they read from config or i18n
- New niche = edit config + translations. No component changes needed.

### 4. Readable & Maintainable
- Code should be understandable by a mid-level developer in under 2 minutes per file
- Explicit over clever — no deep abstractions, no magic
- Components under 200 lines; extract logic into hooks
- Consistent file naming and folder structure

### 5. International from Day One
- English primary, Hungarian included, any language addable via locale file
- Predefined stores per country (Hungary has 12, others start empty)
- Community-contributed stores can be promoted to defaults over time
- All user-facing strings through `useTranslation()` hook

---

## Architecture Changes

### What Survives As-Is (~45 files)

The backend and data layer are already niche-agnostic and well-structured:

| Layer | Files | Notes |
|-------|-------|-------|
| **Convex backend** | `convex/products.ts`, `votes.ts`, `profiles.ts`, `users.ts`, `files.ts`, `ai.ts` | Generic 2-axis voting system. Field names (`safety`/`taste`) are the only niche artifact |
| **Convex config** | `convex/schema.ts`, `convex/lib/config.ts`, `convex/lib/gamification.ts` | Points, badges, roles — all generic |
| **Hooks** | `src/hooks/*` (6 hooks) | `useAdmin`, `useAnonymousId`, `useGeolocation`, `useTranslation`, `useVoteMigration`, `useImpersonate` — all generic |
| **UI primitives** | `src/components/ui/*` (15 shadcn components) | Fully reusable |
| **Utilities** | `src/lib/utils.ts`, `src/lib/auth-client.ts`, `src/lib/auth-server.ts`, `src/lib/env.ts` | Generic |
| **Data components** | `ErrorBoundary`, `NotFound`, `VoteMigrationHandler`, `AdminToolbar`, `LanguageSwitcher` | Layout-independent |
| **Gamification components** | `StatsCard`, `BadgeDisplay`, `Leaderboard`, `DeleteProductButton` | Data-driven, layout-independent |

### What Gets Parameterized (~12 files)

These files work but have hardcoded niche strings that must be extracted to `app-config.ts`. Here is the exact inventory (verified by `grep`):

| File | Hardcoded terms | Change |
|------|----------------|--------|
| `src/lib/types.ts` | `QUADRANTS` names ("Holy Grail", "Survivor Food", etc.), `SAFETY_PRESETS` labels ("Clean", "Sketchy", "Wrecked"), `TASTE_PRESETS` labels ("Yass!", "Meh", "Pass"), descriptions | Move all labels to `app-config.ts`, reference by key |
| `src/locales/en.json` + `hu.json` | Niche-specific labels alongside generic UI strings | Niche labels should key off config values |
| `src/components/dashboard/MatrixChart.tsx` | Inline quadrant labels, axis labels "Safety"/"Taste" | Read from config dimension labels |
| `src/components/dashboard/CoordinateGrid.tsx` | Quadrant colors from `QUADRANTS` constant | Already uses constants — ensure they route through config |
| `src/components/dashboard/ProductCard.tsx` | "Safety: X • Taste: X" inline text | Use `appConfig.dimensions.axis1.label` etc. |
| `src/components/dashboard/VotingPanel.tsx` | Line 30: `"How safe is it for celiacs?"` | Replace with i18n/config reference |
| `src/components/dashboard/FineTunePanel.tsx` | Line 49: `"Safety for Celiacs"` | Replace with config dimension label |
| `src/components/dashboard/AddProductDialog.tsx` | Line 95: `"Add a new gluten-free product..."`, Line 107: `"Schär Gluten-Free Bread"` placeholder | Use config category term + generic placeholder |
| `src/components/dashboard/EditProductDialog.tsx` | Line 110: `"Schär Gluten-Free Bread"` placeholder | Same as AddProductDialog |
| `src/components/product/ImageUploadDialog.tsx` | Line 42: `containsGluten` interface property, Line 304-306: gluten warning UI | Generalize to `containsRiskIngredient` using config `riskConcept` |
| `src/routes/__root.tsx` | Lines 33-34: `"G-Matrix - Gluten-Free Product Ratings"`, `"Community-driven ratings for gluten-free products"` | Read from config app name + tagline |
| `src/routes/login.tsx` | Line 68: `"Rate gluten-free products and help the celiac community..."` | Read from config tagline |

### What Gets Rewritten (~12 files)

These are tightly coupled to the current desktop-first layout:

| File | Current | New |
|------|---------|-----|
| `Navigation.tsx` (217 lines) | Desktop top nav with dropdown, hamburger for mobile | **Bottom tab bar** (Home \| Map \| ➕ \| Profile); top bar = logo + auth avatar |
| `ProductList.tsx` | Sidebar list with search box | **Feed grid** — 2-col card grid with filter chips, scrollable |
| `VotingPanel.tsx` (168 lines) | Desktop card with preset grid + 4 combo buttons | **Mobile voting sheet** — full-width buttons, 48px+ touch targets |
| `FineTunePanel.tsx` (119 lines) | Desktop card with sliders | **Mobile slider panel** — thumb-friendly, labels from config |
| `StoreTagInput.tsx` | Free-text input only | **Searchable dropdown** with predefined stores per locale + "Add custom" |
| `src/routes/index.tsx` | 3-col grid: Chart \| ProductList \| Leaderboard | **Feed page**: filter chips → card grid + Feed ↔ Chart toggle |
| `src/routes/product/$name.tsx` | Desktop layout with sidebar voting | **Product detail**: hero → rating bars → stores → voting → community |
| `src/routes/profile.tsx` | Desktop profile card | **Profile**: user header + level bar → stats → badges → contributions |
| `src/routes/admin.tsx` | Desktop admin dashboard | Adapt to new design tokens |
| `src/routes/leaderboard.tsx` | Leaderboard wrapper | Adapt to new design tokens |
| `src/routes/login.tsx` | Desktop login page | Mobile-optimized login with benefits list |
| `src/routes/__root.tsx` | Desktop layout wrapper | Add PWA meta, bottom tabs, adapted Toaster |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/lib/app-config.ts` | Central niche configuration |
| `src/lib/platform.ts` | Platform detection (isNative, isIOS, isAndroid, isWeb) |
| `src/routes/map.tsx` | Map page with Leaflet |
| `src/components/layout/BottomTabs.tsx` | Bottom tab navigation |
| `src/components/layout/TopBar.tsx` | Minimal top bar |
| `src/components/layout/PageShell.tsx` | Common page wrapper (padding, safe areas) |
| `src/components/feed/ProductCard.tsx` | Redesigned card with safety dots |
| `src/components/feed/FilterChips.tsx` | Filter chip row |
| `src/components/feed/FeedGrid.tsx` | 2-col card grid |
| `src/components/map/ProductMap.tsx` | Leaflet map wrapper |
| `src/components/map/ProductPin.tsx` | Map pin popup |
| `src/components/product/RatingBars.tsx` | Rating bar display |
| `src/components/product/StoreList.tsx` | Stores list with freshness/distance |
| `src/components/product/VotingSheet.tsx` | Mobile-optimized voting UI |
| `public/manifest.json` | PWA manifest |
| `public/icons/` | App icons (192px, 512px, maskable) |
| `capacitor.config.ts` | Capacitor native app config |
| `.github/copilot-instructions.md` | AI agent guidelines |

---

## Design System (from Kimi Specification)

### Colors (CSS custom properties in globals.css)

| Role | Color | Hex |
|------|-------|-----|
| Primary | Sage Green | `#7CB342` |
| Primary Dark | Forest Green | `#558B2F` |
| Primary Light | Light Sage | `#AED581` |
| Background | Cream | `#FAF8F5` |
| Surface | White | `#FFFFFF` |
| Text Primary | Charcoal | `#2D3436` |
| Text Secondary | Gray | `#636E72` |
| Border | Light Gray | `#B2BEC3` |
| Safety High | Green | `#27AE60` |
| Safety Medium | Amber | `#F39C12` |
| Safety Low | Red | `#E74C3C` |
| Achievement | Gold | `#F1C40F` |
| Dark BG | Deep Navy | `#0F172A` |
| Dark Surface | Slate | `#1E293B` |
| Dark Accent | Soft Amber | `#FBBF24` |

### Typography
- **Font**: Inter (Google Fonts), fallback: system-ui, -apple-system, sans-serif
- **Scale**: H1 28px/700 | H2 22px/600 | H3 18px/600 | Body 16px/400 | Small 14px/400 | Caption 12px/500

### Component Patterns
- **Cards**: white bg, 16px border-radius, shadow `0 2px 8px rgba(0,0,0,0.08)`
- **Buttons**: 12px radius, primary = sage green bg / white text, secondary = white bg / sage border
- **Filter chips**: pill shape (24px radius), active = sage green bg / white text, inactive = white / gray border
- **Safety dots**: 8px circles — green (≥80), yellow (50-79), red (<50), gray (no data)
- **Rating bars**: 8px height, rounded ends, sage green fill on light gray background
- **Touch targets**: minimum 44×44px, 8px spacing between targets

### Animations
- Button press: `scale(0.97)` with 100ms spring
- Card hover/tap: `translateY(-2px)` + shadow increase, 200ms ease
- Filter chip toggle: background-color 200ms ease
- Rating bars: width animate on mount (500ms ease-out)
- Page transitions: slide from right for detail pages, fade for modals

---

## Mobile-First Infrastructure

### PWA Setup
- `public/manifest.json` — `display: standalone`, `theme_color: #7CB342`, `background_color: #FAF8F5`
- Service worker for offline caching of app shell (assets, not data — Convex handles real-time sync)
- PWA meta tags in `__root.tsx`: `apple-mobile-web-app-capable`, `theme-color`, `viewport` with `viewport-fit=cover`
- App icons: 192px, 512px, plus maskable variant for Android adaptive icons
- Result: users can "Add to Home Screen" on iOS Safari and Android Chrome

### Capacitor Integration
Capacitor wraps the web app for native app store distribution without a separate codebase.

**Setup:**
- Packages: `@capacitor/core`, `@capacitor/cli`
- Config: `capacitor.config.ts` with `webDir: 'dist/client'`
- Projects: `npx cap add ios` + `npx cap add android` generate native shells
- Build flow: `npm run build` → `npx cap sync` → `npx cap open ios`

**Native Plugins (progressive adoption):**
| Plugin | Purpose | When |
|--------|---------|------|
| `@capacitor/geolocation` | GPS — replaces browser Geolocation API on native | Wave 0 |
| `@capacitor/camera` | Product photo capture | Wave 4 (barcode scan) |
| `@capacitor/share` | Native share sheet | Wave 4 |
| `@capacitor/push-notifications` | Push notifications | Wave 4 |

**Platform detection utility (`src/lib/platform.ts`):**
- `isNative()` — running inside Capacitor
- `isIOS()` / `isAndroid()` / `isWeb()` — platform-specific behavior
- Camera: use Capacitor Camera on native, `<input type="file">` on web
- Maps links: `maps://` on iOS, `geo:` on Android, Google Maps URL on web

### Leaflet Map Integration
- Packages: `leaflet` + `react-leaflet` (~40kb gzipped, fully free, no API key)
- Tiles: OpenStreetMap (free, no registration needed)
- Data source: product store GPS coordinates already stored in `products.stores[].geoPoint`
- `/map` route: full-height map + product list below, colored pins (quadrant color)
- Product detail: small embedded map showing stores for that specific product
- Pin popup: product image thumbnail, name, safety/taste dots, "View Detail" link

---

## `app-config.ts` Structure

The central niche configuration file. Changing this file + adding a locale file = new niche app.

```typescript
// src/lib/app-config.ts — Conceptual structure

export const appConfig = {
  // App identity
  appName: "G-Matrix",
  categoryTerm: "Gluten-Free",
  tagline: "Find safe, tasty products verified by the community",

  // Rating dimensions (the 2 main axes + optional 3rd)
  dimensions: {
    axis1: {
      key: "safety",
      label: "Safety",
      presets: [
        { value: 90, label: "Clean", emoji: "✅" },
        { value: 50, label: "Sketchy", emoji: "⚠️" },
        { value: 10, label: "Wrecked", emoji: "☠️" },
      ],
    },
    axis2: {
      key: "taste",
      label: "Taste",
      presets: [
        { value: 90, label: "Yass!", emoji: "😍" },
        { value: 50, label: "Meh", emoji: "😐" },
        { value: 10, label: "Pass", emoji: "🤢" },
      ],
    },
    axis3: {
      key: "price",
      label: "Price",
      levels: 5, // $, $$, $$$, $$$$, $$$$$
    },
  },

  // Quadrant configuration (2×2 grid based on axis1 × axis2)
  quadrants: {
    topRight:    { id: "holyGrail",       label: "Holy Grail",        emoji: "🏆" },
    topLeft:     { id: "survivorFood",    label: "Survivor Food",     emoji: "🥫" },
    bottomRight: { id: "russianRoulette", label: "Russian Roulette",  emoji: "🎲" },
    bottomLeft:  { id: "theBin",          label: "The Bin",           emoji: "🗑️" },
  },

  // Optional second chart mode (Value Lens)
  valueLens: {
    axis1: { key: "price", label: "Price" },
    axis2: { key: "taste", label: "Taste" },
    quadrants: {
      topRight: { id: "treat",      label: "Treat"      },
      topLeft:  { id: "ripOff",     label: "Rip-Off"    },
      bottomRight: { id: "theSteal", label: "The Steal" },
      bottomLeft:  { id: "cheapFiller", label: "Cheap Filler" },
    },
  },

  // Rating label thresholds
  ratingLabels: [
    { min: 80, label: "Excellent" },
    { min: 60, label: "Good" },
    { min: 40, label: "Fair" },
    { min: 0,  label: "Poor" },
  ],

  // Risk/safety concept (changes per niche)
  riskConcept: "Cross-contamination risk",
  certificationName: "Certified GF",

  // Predefined stores by country code
  storeDefaults: {
    HU: ["Tesco", "Spar", "Aldi", "Lidl", "Penny", "CBA",
         "DM", "Rossmann", "Müller", "COOP", "Auchan", "Interspar"],
    // Other countries start empty — community stores get promoted to defaults
  },

  // Colors (override in globals.css custom properties)
  colors: {
    primary: "#7CB342",
    primaryDark: "#558B2F",
    primaryLight: "#AED581",
    background: "#FAF8F5",
  },
}
```

**Niche swap example** — a vegan version would only change this config:
```
appName: "V-Matrix"
categoryTerm: "Vegan"
dimensions.axis1: { key: "ethics", label: "Ethics", presets: ["Cruelty-Free", "Questionable", "Animal-Tested"] }
quadrants.topRight: { label: "Plant Power" }
riskConcept: "Animal ingredients"
certificationName: "Certified Vegan"
storeDefaults.HU: [...vegan-friendly stores]
```

---

## Key Decisions

| Decision | Chosen | Rationale |
|----------|--------|-----------|
| Chart role | Toggle view on home (default = feed) | New users see intuitive cards; power users toggle to scatter chart |
| Map library | Leaflet + OpenStreetMap | Free, no API key, ~40kb, sufficient for V1, open source |
| Native wrapper | Capacitor | Same codebase for web + iOS + Android, progressive native features |
| Niche config | `app-config.ts` file (git-tracked, not DB) | Simple, no runtime overhead, reviewable in PRs |
| Store defaults | Per-country in config, community-contributed promoted over time | HU preset with 12 stores; others start empty + custom entry |
| PWA vs native-only | PWA first, Capacitor on top | Web works everywhere; app stores reached via Capacitor wrapper |
| Design system | Kimi specification (sage green, Inter, cream) | Professional, clean, trust-building — good first impression |
| Desktop support | Progressive enhancement, not separate layout | Mobile layout scales up; no desktop-specific components needed |

---

## File Structure After Redesign

```
g-convex-v2/
├── .github/
│   ├── copilot-instructions.md          # AI agent guidelines
│   └── workflows/                       # CI/CD (existing)
├── capacitor.config.ts                   # Capacitor native app config
├── public/
│   ├── manifest.json                     # PWA manifest
│   └── icons/                            # App icons (192, 512, maskable)
├── src/
│   ├── lib/
│   │   ├── app-config.ts                 # ★ Central niche configuration
│   │   ├── platform.ts                   # ★ Platform detection (native/web/iOS/Android)
│   │   ├── types.ts                      # Types referencing app-config (no hardcoded labels)
│   │   ├── utils.ts                      # Generic utilities (unchanged)
│   │   ├── i18n.ts                       # Translation system (unchanged)
│   │   ├── auth-client.ts               # Auth (unchanged)
│   │   ├── auth-server.ts               # Auth (unchanged)
│   │   └── env.ts                        # Env detection (unchanged)
│   ├── hooks/                            # All hooks (unchanged)
│   ├── locales/                          # i18n locale files
│   │   ├── en.json
│   │   └── hu.json
│   ├── components/
│   │   ├── ui/                           # shadcn primitives (15 files, unchanged)
│   │   ├── layout/                       # ★ NEW: layout shell
│   │   │   ├── BottomTabs.tsx            # Bottom tab navigation
│   │   │   ├── TopBar.tsx                # Minimal top bar (logo + avatar)
│   │   │   └── PageShell.tsx             # Common page wrapper (safe areas, padding)
│   │   ├── feed/                         # ★ NEW: feed components
│   │   │   ├── ProductCard.tsx           # Card with safety dots, image, distance, badge
│   │   │   ├── FilterChips.tsx           # Horizontal filter chip row
│   │   │   └── FeedGrid.tsx              # 2-col responsive card grid
│   │   ├── product/                      # Product-specific components
│   │   │   ├── RatingBars.tsx            # ★ NEW: safety/taste/price progress bars
│   │   │   ├── StoreList.tsx             # ★ NEW: stores with freshness/distance/maps link
│   │   │   ├── VotingSheet.tsx           # ★ NEW: mobile-optimized voting UI
│   │   │   └── ImageUploadDialog.tsx     # AI image scan (adapted, niche-generalized)
│   │   ├── map/                          # ★ NEW: map components
│   │   │   ├── ProductMap.tsx            # Leaflet map with product pins
│   │   │   └── ProductPin.tsx            # Pin popup with product preview
│   │   ├── dashboard/                    # Retained core components (parameterized)
│   │   │   ├── MatrixChart.tsx           # Scatter chart (toggle view, labels from config)
│   │   │   ├── CoordinateGrid.tsx        # Draggable voting dot (labels from config)
│   │   │   ├── StatsCard.tsx             # Generic stat card (unchanged)
│   │   │   ├── BadgeDisplay.tsx          # Badge grid (unchanged)
│   │   │   ├── Leaderboard.tsx           # Leaderboard table (unchanged)
│   │   │   ├── DeleteProductButton.tsx   # Delete with confirm (unchanged)
│   │   │   ├── ProductCard.tsx           # Admin product card (parameterized: config labels)
│   │   │   ├── ProductList.tsx           # Becomes admin-only; feed version is feed/FeedGrid
│   │   │   ├── VotingPanel.tsx           # Replaced by product/VotingSheet on mobile; kept for admin/desktop
│   │   │   ├── FineTunePanel.tsx         # Sliders with labels from config (parameterized)
│   │   │   ├── StoreTagInput.tsx         # Store input with locale-aware dropdown
│   │   │   ├── AddProductDialog.tsx      # Add product form (parameterized: config placeholders)
│   │   │   └── EditProductDialog.tsx     # Edit product form (parameterized: config placeholders)
│   │   ├── AdminToolbar.tsx              # Unchanged
│   │   ├── ErrorBoundary.tsx             # Unchanged
│   │   ├── LanguageSwitcher.tsx          # Unchanged
│   │   ├── NotFound.tsx                  # Unchanged
│   │   └── VoteMigrationHandler.tsx      # Unchanged
│   ├── routes/
│   │   ├── __root.tsx                    # Updated: PWA meta, TopBar + BottomTabs layout shell
│   │   ├── index.tsx                     # Feed + chart toggle
│   │   ├── map.tsx                       # ★ NEW: Leaflet map page
│   │   ├── product/$name.tsx             # Redesigned product detail
│   │   ├── profile.tsx                   # Redesigned profile
│   │   ├── leaderboard.tsx               # Adapted to new design tokens
│   │   ├── admin.tsx                     # Adapted to new design tokens
│   │   ├── login.tsx                     # Mobile-optimized
│   │   └── files.tsx                     # Dev utility (kept, low priority to restyle)
│   └── styles/
│       └── globals.css                   # Updated: Kimi design tokens as CSS custom properties
├── convex/                               # Backend (entirely unchanged)
│   ├── products.ts
│   ├── votes.ts
│   ├── profiles.ts
│   ├── users.ts
│   ├── ai.ts
│   ├── files.ts
│   ├── schema.ts
│   └── lib/
│       ├── config.ts
│       ├── gamification.ts
│       └── authHelpers.ts
├── ios/                                  # ★ NEW: Capacitor iOS project (gitignored build artifacts)
├── android/                              # ★ NEW: Capacitor Android project (gitignored build artifacts)
└── docs/
    ├── FEATURE_GAP_ANALYSIS.md           # Feature comparison vs old repos
    └── newdirection/
        ├── REDESIGN_PLAN.md              # This document
        ├── PRIORITY_LIST.md              # Complete weighted feature priority list
        └── Kimi_Agent_Gluten-Free App UI Plan/  # Kimi design reference (images + docs)
```

---

## Success Criteria for Public Launch

The app is ready for public release when all of these are true:

| # | Criterion | How to verify |
|---|-----------|---------------|
| 1 | **Feed works** | Home screen shows product cards in 2-col grid, search works, filter chips filter |
| 2 | **Voting works** | Cast vote with safety + taste + price + store + GPS → product average updates |
| 3 | **Product detail complete** | Image, rating bars, stores list, voting section, ingredients — all render |
| 4 | **Map works** | Map page shows product pins from GPS data, tap pin → product preview |
| 5 | **Auth works** | Google sign-in, anonymous voting, vote migration on sign-up |
| 6 | **Gamification visible** | Points, badges, streaks, leaderboard — all visible and rewarding |
| 7 | **PWA installable** | "Add to Home Screen" works on iOS Safari + Android Chrome |
| 8 | **Mobile-first** | All pages look good and work at 375px width, 44px+ touch targets |
| 9 | **No hardcoded niche** | `grep -r "gluten\|celiac" src/ --include="*.tsx"` finds only config/locale refs |
| 10 | **Performance** | <3s first contentful paint, <5s time to interactive on throttled 3G |

---

*This document is the source of truth for the redesign direction. Detailed sprint plans are in `PRIORITY_LIST.md`. Agent coding guidelines are in `.github/copilot-instructions.md`.*
