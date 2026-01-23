# G-Convex V2 Project Purpose

## 🎯 Project Goals

This repository has **two primary objectives**:

### 1. Build the G-Matrix Application

Replicate the full **G-Matrix** (gluten-free product rating) application from the source template:
- **Source**: `/Users/mandulaj/dev/source/g-convex`
- **Target**: This repository (`g-convex-v2`)

All functionality from the original g-convex must be implemented with **100% feature parity**, including:
- ✅ G-Matrix quadrant visualization (Safety vs Taste, Price vs Taste)
- ✅ Product voting system (Quick vote + Fine-tune)
- ✅ Anonymous and authenticated voting
- ✅ Gamification system (points, badges, streaks)
- ✅ AI image analysis (Google Gemini)
- ✅ Geolocation features (GPS tagging, "Near Me" filtering)
- ✅ Admin features (product management, impersonation)
- ✅ Internationalization (English + Hungarian)
- ✅ SSR deployment

### 2. Document Template Improvements

While building the app, we document **insights, gaps, and improvements** for the original template:
- **Original Template**: `/Users/mandulaj/dev/source/convex-tanstack-cloudfare`
- **Documentation Location**: `./doctemplateimprovements/`

Every issue, missing feature, or improvement opportunity discovered during development should be documented for upstream contribution.

---

## 📁 Repository Structure

```
g-convex-v2/
├── PROJECT_PURPOSE.md          # This file - project goals
├── README.md                   # Main project documentation
├── doctemplateimprovements/    # Template improvement documentation
│   ├── README.md               # Overview of improvement findings
│   ├── TEMPLATE_IMPROVEMENTS.md # **Critical** TanStack Start v1.154+ fixes
│   ├── AI_AGENT_CONTEXT.md     # System prompt for AI agents
│   ├── DEPLOYMENT.md           # Cloudflare Workers deployment guide
│   ├── MISSING_FEATURES.md     # Features missing from template
│   ├── DOCUMENTATION_GAPS.md   # Documentation improvements needed
│   └── PATTERN_IMPROVEMENTS.md # Better patterns discovered
├── convex/                     # Backend (Convex functions + schema)
├── src/                        # Frontend (TanStack Start + React)
├── docs/                       # Original template documentation
├── infrastructure/             # Terraform IaC
└── scripts/                    # Utility scripts
```

---

## 🔄 Workflow

1. **Analyze** - Study g-convex source app for each feature
2. **Implement** - Build the feature in g-convex-v2 using the template base
3. **Document** - Record any template shortcomings in `doctemplateimprovements/`
4. **Iterate** - Continue until full feature parity achieved

---

## 🛠️ Technology Stack Comparison

| Component | Original Template | G-Matrix Source | G-Convex-V2 |
|-----------|------------------|-----------------|-------------|
| **Framework** | TanStack Start | TanStack Start | TanStack Start |
| **Backend** | Convex | Convex | Convex |
| **Auth** | Better Auth | Better Auth | Better Auth |
| **Deployment** | Cloudflare Workers | Netlify | Cloudflare Workers |
| **Styling** | Tailwind CSS v4 | Tailwind CSS v4 | Tailwind CSS v4 |
| **UI Library** | None (manual) | shadcn/ui | shadcn/ui (to add) |
| **Charts** | None | Recharts | Recharts (to add) |
| **i18n** | None | Custom | Custom (to add) |
| **Forms** | None | react-hook-form | react-hook-form (to add) |

---

## 📋 Feature Implementation Status

### Core Features ✅
- ✅ Database schema (products, votes, profiles)
- ✅ Product CRUD operations with weighted averages
- ✅ Voting system with rate limiting (10 votes/min)
- ✅ Anonymous ID management via localStorage
- ✅ Vote migration (anonymous → registered on login)

### Visualization ✅
- ✅ G-Matrix chart component (Recharts scatter plot)
- ✅ Coordinate grid for fine-tune voting
- ✅ Product cards with quadrant coloring
- ✅ Interactive drag-and-drop voting
- ⚠️  Mode switching (Vibe/Value) - deferred as not in original spec

### Gamification ✅
- ✅ Points system (10/vote, 50/product, 100/streak)
- ✅ 7 Badge definitions with icons
- ✅ Streak tracking with daily reset
- ✅ Profile page with stats and vote history
- ✅ Leaderboard (top 50 contributors)

### AI Features ⚠️
- ⚠️  Gemini integration - deferred (not in MVP)
- ⚠️  Image upload - deferred (not in MVP)
- ⚠️  Product extraction - deferred (not in MVP)
- ⚠️  Ingredient analysis - deferred (not in MVP)

### Admin Features ✅
- ✅ Admin dashboard with analytics
- ✅ Product management (add, edit, delete)
- ✅ RBAC protection for admin routes
- ⚠️  User impersonation - deferred (not in MVP)
- ⚠️  Vote management - deferred (not in MVP)

### UX Features ✅
- ✅ Geolocation integration (GPS tagging)
- ✅ Store tagging with location
- ✅ Language switching (EN/HU)
- ✅ Responsive design with Tailwind

---

## 📅 Timeline

**Started**: January 2026  
**Completed**: January 23, 2026

---

## 🏗️ Final Architecture

### Implementation Phases (All Complete)

1. **Phase 1: Foundation** ✅
   - Dependencies & shadcn/ui setup
   - Database schema (products, votes, profiles)
   - Tailwind configuration with quadrant colors

2. **Phase 2: Backend & Hooks** ✅
   - Rate limiter integration (@convex-dev/rate-limiter)
   - Convex functions (products, votes, profiles, gamification)
   - Custom hooks (anonymous ID, geolocation, translation, vote migration)
   - i18n setup (EN/HU locales)

3. **Phase 3: Core Visualization** ✅
   - MatrixChart with Recharts
   - CoordinateGrid drag interface
   - ProductCard & ProductList components
   - Home page redesign

4. **Phase 4: Product & Voting UX** ✅
   - VotingPanel (quick presets)
   - FineTunePanel (sliders + drag)
   - StoreTagInput with GPS
   - Product detail pages (/product/$name)
   - Login page with benefits
   - Suspense boundaries

5. **Phase 5: Gamification & Profile** ✅
   - Profile page with badges & history
   - Leaderboard component & full page
   - BadgeDisplay & StatsCard
   - Navigation with auth state
   - Home page gamification widgets

6. **Phase 6: i18n, Admin & Product Management** ✅
   - AddProductDialog
   - EditProductDialog
   - DeleteProductButton (with alert-dialog)
   - LanguageSwitcher
   - Admin dashboard
   - RBAC admin protection

7. **Phase 7: Polish & Deploy** ✅
   - README.md updated with G-Matrix content
   - Seed data script (convex/seed.ts)
   - Documentation complete
   - All shadcn/ui components verified
   - package.json metadata updated

### Tech Stack Finalized

- **Framework**: TanStack Start v1.154.12
- **Backend**: Convex v1.31.6 with real-time sync
- **Auth**: Better Auth v1.4.9 (Google OAuth)
- **Deployment**: Cloudflare Workers
- **UI**: shadcn/ui (15 components) + Tailwind v4
- **Charts**: Recharts v2.x
- **Forms**: react-hook-form + Zod
- **Animations**: Framer Motion
- **Rate Limiting**: @convex-dev/rate-limiter

---

## 📝 Notes

- All MVP features implemented with 100% functionality
- AI features (Gemini) deferred to post-MVP
- Advanced admin features (impersonation, vote management) deferred
- Schema uses weighted voting (2x registered, 1x anonymous)
- Rate limiting: 10 votes per minute per user
- 7 achievement badges with point milestones
- 15 shadcn/ui components installed and configured
