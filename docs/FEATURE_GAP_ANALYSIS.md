# Feature Gap Analysis: g-convex-v2 vs g-matrix + g-convex

> Generated 2026-02-08 from exhaustive source code comparison of all three repos.

## Legend

- ✅ = Fully implemented in g-convex-v2
- 🟡 = Partially implemented (see notes)
- ❌ = Missing entirely

---

## 1. Chart / Visualization

| # | Feature | g-matrix | g-convex | g-convex-v2 | Status |
|---|---------|----------|----------|-------------|--------|
| 1.1 | Safety vs Taste scatter chart (vibe mode) | ✅ | ✅ | ✅ Recharts | ✅ |
| 1.2 | **Price vs Taste chart (value mode)** | ✅ | ✅ | — | ❌ |
| 1.3 | **Chart mode switcher (Vibe / Value lens)** | ✅ | ✅ | — | ❌ |
| 1.4 | Quadrant background colors | ✅ | ✅ | ✅ | ✅ |
| 1.5 | Quadrant corner labels | ✅ | ✅ | ✅ | ✅ |
| 1.6 | **Value-mode quadrant names** (Treat, Rip-Off, The Steal, Cheap Filler) | ✅ | ✅ | — | ❌ |
| 1.7 | **Dollar sign Y-axis in value mode** ($–$$$$$) | ✅ | ✅ | — | ❌ |
| 1.8 | Product dot click → select/highlight | ✅ | ✅ | ✅ | ✅ |
| 1.9 | **Consistent product-name-hash color** per dot | ✅ | ✅ | Uses quadrant color | 🟡 |
| 1.10 | Custom tooltip on hover | ✅ | ✅ | ✅ | ✅ |
| 1.11 | Bubble size by vote count | — | — | ✅ (ZAxis) | ✅ |
| 1.12 | **ProductVibeChart** (background chart for draggable dot overlay) | ✅ | ✅ Recharts | SVG CoordinateGrid | 🟡 |
| 1.13 | **All Votes dot visualization** (show every individual vote on chart) | ✅ | ✅ | — | ❌ |
| 1.14 | **My Vote dot** on chart (separate from average) | ✅ | ✅ | — | ❌ |
| 1.15 | **Color-coded vote dots** (green=registered, gray=anonymous, gold=impersonated) | ✅ | ✅ | — | ❌ |

---

## 2. Voting

| # | Feature | g-matrix | g-convex | g-convex-v2 | Status |
|---|---------|----------|----------|-------------|--------|
| 2.1 | 3-option safety quick vote (Clean/Sketchy/Wrecked) | ✅ 80/50/20 | ✅ 80/50/20 | ✅ 90/50/10 | ✅ (values differ) |
| 2.2 | 3-option taste quick vote (Yass/Meh/Pass) | ✅ 80/50/20 | ✅ 80/50/20 | ✅ 90/50/10 | ✅ (values differ) |
| 2.3 | **4 combo quadrant presets** (Holy Grail, Survivor Food, Risky Treat, The Bin) | — | — | ✅ | ✅ (new) |
| 2.4 | Fine-tune sliders (0–100) | ✅ | ✅ | ✅ | ✅ |
| 2.5 | Draggable dot on coordinate grid | ✅ | ✅ | ✅ SVG-based | ✅ |
| 2.6 | **5-level price vote ($–$$$$$)** | ✅ | ✅ | Schema only | ❌ UI |
| 2.7 | **Store dropdown with 12 predefined stores** | ✅ | ✅ | Free text input only | 🟡 |
| 2.8 | **Custom store text input** | ✅ | ✅ | ✅ | ✅ |
| 2.9 | GPS location checkbox on vote | ✅ | ✅ | ✅ (button) | ✅ |
| 2.10 | Vote update (re-vote overwrites) | ✅ | ✅ | ✅ | ✅ |
| 2.11 | Weighted averages (registered 2× / anonymous 1×) | ✅ | ✅ | ✅ | ✅ |
| 2.12 | Rate limiting | IP-based | Token bucket | ✅ Token bucket | ✅ |
| 2.13 | **"Agree with Community" one-click vote** | ✅ | ✅ | — | ❌ |
| 2.14 | Vote migration (anonymous → registered) | — | ✅ | ✅ | ✅ |
| 2.15 | Delete own vote | — | — | ✅ | ✅ (new) |
| 2.16 | **View tabs (Average / My Vote / All Votes)** on product page | ✅ | ✅ | — | ❌ |
| 2.17 | Gamification toasts (points earned, badge unlock) | ✅ | ✅ toast | Toast on vote success only | 🟡 |
| 2.18 | **Report Product button** | ✅ UI | ✅ UI | — | ❌ |

---

## 3. Filtering & Search

| # | Feature | g-matrix | g-convex | g-convex-v2 | Status |
|---|---------|----------|----------|-------------|--------|
| 3.1 | Text search by product name | ✅ | ✅ | ✅ | ✅ |
| 3.2 | **Quadrant quick-filter buttons** (toggle per quadrant) | ✅ | ✅ | — | ❌ |
| 3.3 | **"Near Me" GPS filter** (5km radius, Haversine) | ✅ | ✅ | Has `calculateDistance()` but no filter UI | ❌ UI |
| 3.4 | **Combined filter logic** (search + quadrant + near-me AND) | ✅ | ✅ | Search only | ❌ |
| 3.5 | Sort by vote count | — | — | ✅ | ✅ |

---

## 4. Product Detail Page

| # | Feature | g-matrix | g-convex | g-convex-v2 | Status |
|---|---------|----------|----------|-------------|--------|
| 4.1 | Product image display | ✅ | ✅ | ✅ | ✅ |
| 4.2 | **Back image display** | ✅ placeholder | ✅ schema | Schema only | ❌ UI |
| 4.3 | Stats row (safety, taste, votes) | ✅ | ✅ | ✅ | ✅ |
| 4.4 | Quadrant badge | ✅ | ✅ | ✅ | ✅ |
| 4.5 | **Rating labels** (Excellent/Good/Fair/Poor per metric) | ✅ | ✅ | — | ❌ |
| 4.6 | **Price display** (average price as $–$$$$$ or Cheap/Moderate/Expensive) | ✅ | ✅ | Schema has avgPrice, no UI | ❌ UI |
| 4.7 | **Stores list card** with freshness indicators | ✅ | ✅ | Schema has stores array, no UI | ❌ UI |
| 4.8 | **Store freshness opacity** (green <7d, yellow <30d, faded >30d) | ✅ | ✅ | — | ❌ |
| 4.9 | **"Near Me" badge on stores** within 5km | ✅ | ✅ | — | ❌ |
| 4.10 | **Clickable store → open native maps** (Apple Maps/Google Maps) | ✅ | — | — | ❌ |
| 4.11 | Ingredients card | ✅ | ✅ | ✅ (admin only) | 🟡 |
| 4.12 | **Admin voter list** (scrollable, all votes with user ID, badges, delete, impersonate) | ✅ | ✅ | Recent votes (last 10, no admin actions) | 🟡 |
| 4.13 | **Per-vote delete** (admin) | ✅ | ✅ | — | ❌ |
| 4.14 | **Per-vote impersonate** (admin eye icon to view as that user) | ✅ | ✅ | — | ❌ |
| 4.15 | Vote creation on product page | ✅ | ✅ | ✅ (CoordinateGrid + VotingPanel + FineTunePanel) | ✅ |

---

## 5. Product Creation / Image Upload

| # | Feature | g-matrix | g-convex | g-convex-v2 | Status |
|---|---------|----------|----------|-------------|--------|
| 5.1 | Image upload + AI scan | ✅ | ✅ | ✅ | ✅ |
| 5.2 | AI-powered product name extraction | ✅ Genkit | ✅ Gemini 1.5 | ✅ Gemini 2.0 Flash | ✅ |
| 5.3 | AI safety/taste score suggestions | — | ✅ | ✅ | ✅ |
| 5.4 | AI ingredient tag extraction | — | ✅ | ✅ | ✅ |
| 5.5 | **Gluten-free assessment** (isGlutenFree, riskLevel) | ✅ | — | ✅ containsGluten flag | ✅ |
| 5.6 | Allergen warnings | — | — | ✅ warnings array | ✅ (new) |
| 5.7 | **Client-side image resize + WebP conversion** before upload | ✅ (1024px, WebP 80%) | ✅ | — (sends raw file) | ❌ |
| 5.8 | **Image dimension validation** (min 200×200) | ✅ | ✅ | — | ❌ |
| 5.9 | Image size validation (max) | 20MB | 20MB | 10MB | ✅ (stricter) |
| 5.10 | **Drag-and-drop upload** | ✅ | ✅ | Click only | ❌ |
| 5.11 | Editable AI results before submit | ✅ | ✅ | ✅ | ✅ |
| 5.12 | Manual product entry (no image) | — | — | ✅ AddProductDialog | ✅ (new) |
| 5.13 | **Vibe-Check flow** (post-scan landing page with VotingPanel) | ✅ | ✅ (product/new-*) | Direct submit in dialog | 🟡 |
| 5.14 | **Unnamed product naming** (user names product if AI can't) | ✅ | ✅ | Falls back to manual entry | 🟡 |
| 5.15 | **Duplicate product detection** (on name submit) | ✅ | ✅ | ✅ (backend check) | ✅ |

---

## 6. Admin Features

| # | Feature | g-matrix | g-convex | g-convex-v2 | Status |
|---|---------|----------|----------|-------------|--------|
| 6.1 | Admin determination (email whitelist / role) | ✅ Firestore doc | ✅ email + role | ✅ email + first-user + role | ✅ |
| 6.2 | Admin page with stats | — | ✅ | ✅ | ✅ |
| 6.3 | Product CRUD (create/edit/delete) | Delete only | Delete + recalc | ✅ Full CRUD | ✅ |
| 6.4 | Admin toolbar (floating indicator) | ✅ | ✅ | ✅ | ✅ |
| 6.5 | "View as User" toggle (impersonation) | ✅ | ✅ | ✅ | ✅ |
| 6.6 | **Per-product time-decay recalculate** | ✅ | ✅ | — | ❌ |
| 6.7 | **Batch recalculate all products** | ✅ | ✅ | — | ❌ |
| 6.8 | **Per-vote admin delete on product page** | ✅ | ✅ | — | ❌ |
| 6.9 | **Admin voter list with impersonate** | ✅ | ✅ | — | ❌ |

---

## 7. Gamification

| # | Feature | g-matrix | g-convex | g-convex-v2 | Status |
|---|---------|----------|----------|-------------|--------|
| 7.1 | Points system | ✅ | ✅ | ✅ | ✅ |
| 7.2 | Badge system | ✅ 6 badges | ✅ 6 badges | ✅ 7 badges | ✅ |
| 7.3 | Voting streak tracking | ✅ | ✅ | ✅ | ✅ |
| 7.4 | **Gamification toasts** (points earned + badge unlocked) | ✅ | ✅ | Vote success toast only | ❌ specific |
| 7.5 | **ScoutCard popover** in header (points + badge summary) | ✅ | ✅ | Points in nav dropdown | 🟡 |
| 7.6 | **Level progress bar** (XP toward Elite Scout) | — | ✅ (1000 XP) | — | ❌ |
| 7.7 | Profile page with badges, history, products | — | ✅ | ✅ | ✅ |
| 7.8 | Leaderboard | — | — | ✅ | ✅ (new) |
| 7.9 | Badge display (compact + full grid) | — | — | ✅ | ✅ (new) |

---

## 8. Location Features

| # | Feature | g-matrix | g-convex | g-convex-v2 | Status |
|---|---------|----------|----------|-------------|--------|
| 8.1 | Browser geolocation API hook | ✅ Context | ✅ Context | ✅ Hook | ✅ |
| 8.2 | GPS coordinates stored with votes | ✅ | ✅ geoPoint | ✅ lat/lon | ✅ |
| 8.3 | **"Near Me" filter on home page** (5km radius) | ✅ | ✅ | Has utility, no UI | ❌ UI |
| 8.4 | **"Near Me" badge on stores** | ✅ | ✅ | — | ❌ |
| 8.5 | **Location status in header** (green/red icon) | ✅ | ✅ | — | ❌ |
| 8.6 | **Clickable store → native maps** | ✅ | — | — | ❌ |
| 8.7 | GPS capture button on vote form | ✅ checkbox | ✅ checkbox | ✅ button | ✅ |
| 8.8 | Haversine distance calc utility | — | — | ✅ | ✅ |
| 8.9 | **Store freshness list with GPS badges** | ✅ | ✅ | — | ❌ |

---

## 9. Scheduling / Background Tasks

| # | Feature | g-matrix | g-convex | g-convex-v2 | Status |
|---|---------|----------|----------|-------------|--------|
| 9.1 | **Daily time-decay cron** (0.5% daily decay) | — | ✅ midnight UTC | — | ❌ |
| 9.2 | **Time-decay weighted recalculation** (0.9/year, min 0.1) | ✅ server action | ✅ internal mutation | — | ❌ |
| 9.3 | **Migrations framework** (@convex-dev/migrations) | — | ✅ | — | ❌ |
| 9.4 | **Sharded counter** for high-concurrency votes | — | ✅ | — | ❌ |

---

## 10. Layout / Navigation / UX

| # | Feature | g-matrix | g-convex | g-convex-v2 | Status |
|---|---------|----------|----------|-------------|--------|
| 10.1 | Sticky header with logo | ✅ | ✅ | ✅ | ✅ |
| 10.2 | Header auth (avatar, login/logout) | ✅ | ✅ | ✅ | ✅ |
| 10.3 | **Context-aware nav** (Back to Home / Scan Product) | ✅ | ✅ | Always shows all links | 🟡 |
| 10.4 | Language switcher | ✅ | ✅ | ✅ | ✅ |
| 10.5 | i18n with HU translations | ✅ next-intl | ✅ | ✅ custom | ✅ |
| 10.6 | **Mobile hamburger menu** | — | — | ✅ | ✅ (new) |
| 10.7 | Loading skeletons | ✅ | ✅ | ✅ | ✅ |
| 10.8 | **Responsive layout** (3-col desktop, 1-col mobile) | ✅ | ✅ | ✅ | ✅ |
| 10.9 | **Product-list ↔ chart highlight sync** (scroll into view) | ✅ | ✅ | Partial (no scroll-to) | 🟡 |
| 10.10 | **Ad slot placeholder** | ✅ | ✅ | — | ❌ |

---

## Priority Summary: Missing Features

### High Priority (Core UX that users had before)

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 1.2 | **Price vs Taste chart mode (Value Lens)** | Medium | High — core differentiator |
| 1.3 | **Chart mode switcher** | Small | High — enables Value Lens |
| 2.6 | **5-level price vote UI ($–$$$$$)** | Small | High — data already in schema |
| 2.16 | **View tabs (Average / My Vote / All Votes)** on product page | Medium | High — core product page UX |
| 3.2 | **Quadrant quick-filter buttons** | Small | High — home page filtering |
| 3.3 | **"Near Me" GPS filter** on home page | Medium | High — location is a key value prop |
| 4.6 | **Price display on product page** | Small | Medium — schema supports it |
| 4.7 | **Stores list card** on product page | Medium | High — users reported stores |
| 2.7 | **Predefined store dropdown** (12 Hungarian stores) | Small | Medium — easier store tagging |

### Medium Priority (Power features)

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 1.13 | **All Votes visualization** (every vote as a dot on chart) | Medium | Medium — insight into vote dist. |
| 1.14 | **My Vote dot** on chart | Small | Medium — see your own vote |
| 2.13 | **"Agree with Community" one-click vote** | Small | Medium — lower friction |
| 4.5 | **Rating labels** (Excellent/Good/Fair/Poor) | Small | Low — polish |
| 4.8 | **Store freshness indicators** | Small | Medium — freshness UX |
| 4.9 | **"Near Me" badge on stores** | Small | Medium — location context |
| 4.10 | **Clickable store → native maps** | Small | Medium — UX convenience |
| 5.7 | **Client-side image resize + WebP** | Medium | Medium — bandwidth saving |
| 5.10 | **Drag-and-drop upload** | Small | Low — convenience |
| 7.4 | **Gamification toasts** (points + badge popups) | Small | Medium — engagement |
| 7.6 | **Level progress bar** (XP toward Elite Scout) | Small | Low — visual polish |
| 9.1 | **Daily time-decay cron** | Small | Medium — data quality |
| 9.2 | **Time-decay weighted recalculation** | Medium | Medium — data quality |

### Low Priority (Nice to have / Polish)

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 1.9 | **Consistent name-hash colors** per product dot | Small | Low — visual consistency |
| 4.2 | **Back image display** | Small | Low — rarely used |
| 4.12 | **Full admin voter list** (with delete/impersonate per vote) | Medium | Low — admin tool |
| 5.8 | **Image dimension validation** (min 200×200) | Small | Low — edge case |
| 5.13 | **Vibe-Check flow** (post-scan landing page) | Medium | Low — current dialog flow works |
| 6.6 | **Per-product time-decay recalculate** | Small | Low — admin tool |
| 6.7 | **Batch recalculate all** | Small | Low — admin tool |
| 7.5 | **ScoutCard popover** in header | Small | Low — polish |
| 8.5 | **Location status icon** in header | Small | Low — visual indicator |
| 9.3 | **Migrations framework** | Small | Low — as needed |
| 9.4 | **Sharded counter** for vote counts | Medium | Low — only at high scale |
| 10.3 | **Context-aware nav** (Scan vs Back) | Small | Low — UX polish |
| 10.9 | **Chart ↔ list scroll-into-view sync** | Small | Low — UX polish |
| 10.10 | **Ad slot placeholder** | Tiny | Low — future monetization |
| 2.18 | **Report Product button** | Small | Low — was stub only |

---

## Features NEW in g-convex-v2 (not in originals)

These features were added fresh in v2 and should be kept:

| Feature | Notes |
|---------|-------|
| Leaderboard page (top 50) | New page + component |
| Leaderboard sidebar (top 10 on home) | Embedded in home page |
| BadgeDisplay component (compact + full grid) | Better badge visualization |
| 4 combo quick-vote presets | Holy Grail/Survivor Food/Risky Treat/The Bin one-click |
| AddProductDialog (manual entry form) | No-image product creation |
| EditProductDialog | Full product editing |
| Files page (Convex storage demo) | File upload/download/delete |
| Product Pioneer badge | 5 new products created — new badge |
| First-user auto-admin | No email config needed for first deploy |
| Mobile hamburger menu | Responsive nav |
| SSR-safe Suspense wrappers | All routes wrapped for TanStack Start SSR |
| Seed data script | 12 demo products for development |
