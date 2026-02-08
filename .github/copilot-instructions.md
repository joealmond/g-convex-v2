# G-Matrix: AI Agent Guidelines

> **Note:** This document describes the **post-redesign target architecture**. Files and folders marked with ★ may not exist yet — they are part of the planned redesign (see `docs/newdirection/REDESIGN_PLAN.md`). When a ★ file doesn't exist, check the current codebase for the equivalent existing implementation.

## What Is This App?

G-Matrix is a **community-driven product rating platform**. Users discover, rate, and locate niche products using a multi-dimensional voting system (2 main axes + price). The current niche is **gluten-free products**, but the codebase is designed to be **reusable for any product niche** (vegan, keto, organic, etc.) by changing a single config file.

**Core user flow**: Discover products in a feed → View product detail → Vote (safety + taste + price + store + GPS) → See where to buy → Earn points and badges.

## Architecture Principles

1. **Niche config, not niche code** — All niche-specific terms (app name, dimension labels like "Safety"/"Taste", quadrant names like "Holy Grail", preset labels, store defaults, colors) live in `src/lib/app-config.ts`. Components read from this config or `useTranslation()`. **Never hardcode niche strings in components.**

2. **Mobile-first** — Design for 375px phone screens first. Bottom tab navigation. Desktop is progressive enhancement. Touch targets ≥ 44px. Test on iOS Safari and Android Chrome.

3. **Readable by humans** — A mid-level developer should understand any file in under 2 minutes. Prefer explicit code over clever abstractions. No deep nesting. No magic. Name things obviously.

4. **Components under 200 lines** — If a component exceeds 200 lines, extract logic into a custom hook or split into sub-components. One file = one responsibility.

5. **Backend is generic** — Convex functions in `convex/` are niche-agnostic. They operate on two-axis voting (fields named `safety`/`taste` for historical reasons, but the logic is generic threshold-based math). Don't add niche-specific logic to backend functions.

6. **Config over code** — Swapping niches should require editing `src/lib/app-config.ts` + adding a locale file in `src/locales/`. No component file changes.

7. **SSR-safe** — All routes use TanStack Start SSR. Wrap hook-heavy content in `<Suspense fallback={<Skeleton/>}>`. Never call browser APIs (`window`, `localStorage`, `navigator`) outside `useEffect` or `<ClientOnly>`.

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | TanStack Start + TanStack Router | SSR React framework |
| Backend | Convex | Real-time database + serverless functions |
| Auth | Better Auth via `@convex-dev/better-auth` | Google OAuth, session-based |
| Deployment | Cloudflare Workers | Edge SSR |
| Native | Capacitor | iOS/Android wrapper for the same web codebase |
| UI | shadcn/ui + Tailwind CSS v4 | Component library + utility CSS |
| Charts | Recharts | Scatter plot visualization |
| Maps | Leaflet + react-leaflet + OpenStreetMap | Free, no API key needed |
| Animations | Framer Motion | Micro-interactions and transitions |
| Forms | react-hook-form + Zod | Form state + validation |
| i18n | Custom `useTranslation()` + JSON locale files | EN + HU, extensible |

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/app-config.ts` | ★ Central niche configuration — start here to understand the app's identity |
| `src/lib/types.ts` | TypeScript types, quadrant logic — references app-config for labels |
| `src/lib/platform.ts` | ★ Platform detection: isNative(), isIOS(), isAndroid(), isWeb() |
| `convex/schema.ts` | Database schema: products, votes, profiles, files tables |
| `convex/votes.ts` | Vote casting, rate limiting, weighted average recalculation |
| `convex/products.ts` | Product CRUD operations |
| `convex/lib/gamification.ts` | Points system, badge definitions, streak logic |
| `convex/lib/config.ts` | Admin emails, roles |
| `src/routes/` | One file per screen/page |
| `src/components/layout/` | ★ Navigation shell: BottomTabs, TopBar, PageShell |
| `src/components/feed/` | ★ Home feed: ProductCard, FilterChips, FeedGrid |
| `src/components/product/` | Product detail: RatingBars★, StoreList★, VotingSheet★, ImageUploadDialog |
| `src/components/map/` | ★ Leaflet map: ProductMap, ProductPin |
| `src/components/dashboard/` | Chart views: MatrixChart, CoordinateGrid, StatsCard, BadgeDisplay, Leaderboard, DeleteProductButton |
| `src/hooks/` | Custom hooks: useAdmin, useGeolocation, useTranslation, useAnonymousId, useVoteMigration, useImpersonate |
| `src/locales/en.json` | English translations |
| `src/locales/hu.json` | Hungarian translations |

## Coding Conventions

### Strings & Labels
- Use `const { t } = useTranslation()` for all user-facing text
- Read dimension names from `appConfig.dimensions.axis1.label` (not inline "Safety")
- Read quadrant names from `appConfig.quadrants.topRight.label` (not inline "Holy Grail")
- Niche-specific strings belong in `app-config.ts` or `locales/*.json`, never in components

### Styling
- Tailwind utility classes for layout and spacing
- CSS custom properties from `globals.css` for theme colors (`var(--color-primary)`, etc.)
- Use `cn()` helper from `src/lib/utils.ts` to merge conditional classes
- Cards: `rounded-2xl shadow-sm bg-white`
- Buttons: `rounded-xl` with minimum 44×44px touch target on mobile

### State Management
- **Server data**: Convex queries via `useQuery(api.products.list)` — real-time, no manual refresh
- **Local UI state**: React `useState` / `useReducer`
- **No global state library** — Convex + React state is sufficient
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

Cards: `bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)]`

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

## Planning Documents

| File | Purpose |
|------|---------|
| `docs/newdirection/REDESIGN_PLAN.md` | Full redesign direction, architecture, decisions |
| `docs/newdirection/PRIORITY_LIST.md` | **Single source of truth** — complete priority list with checkboxes for progress |
| `docs/FEATURE_GAP_ANALYSIS.md` | Feature comparison vs. previous app versions (g-matrix, g-convex) |
| `docs/newdirection/MOBILE_APPROACH_DECISION.md` | Decision record: Capacitor chosen over Replit+Expo |
| `docs/newdirection/Kimi_Agent_Gluten-Free App UI Plan/` | Kimi design reference (mockup images + design system spec) |

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
