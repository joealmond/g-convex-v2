# Priority Checklist

All outstanding features, ordered by priority. Check off items as they are completed.

> Source: [FEATURE_GAP_ANALYSIS.md](../../FEATURE_GAP_ANALYSIS.md) (git history) + [PRIORITY_LIST.md](../../docs/newdirection/PRIORITY_LIST.md) (git history)

---

## 🔴 High Priority — Core UX

### Chart & Visualization
- [ ] Price vs Taste chart mode (Value Lens) — core differentiator
- [ ] Chart mode switcher (Vibe / Value toggle)
- [ ] Value-mode quadrant names (Treat, Rip-Off, The Steal, Cheap Filler)
- [ ] Dollar sign Y-axis in value mode ($–$$$$$)

### Voting
- [ ] 5-level price vote UI ($–$$$$$) — schema already supports it
- [ ] Predefined store dropdown (12 Hungarian stores) + custom text
- [ ] View tabs on product page (Average / My Vote / All Votes)
- [ ] "Agree with Community" one-click vote

### Filtering & Search
- [ ] Quadrant quick-filter buttons on home page
- [ ] "Near Me" GPS filter on home page (5km radius, Haversine)
- [ ] Combined filter logic (search + quadrant + near-me AND)

### Product Detail Page
- [ ] Price display (average price as $–$$$$$ or Cheap/Moderate/Expensive)
- [ ] Stores list card with freshness indicators
- [ ] Store freshness opacity (green <7d, yellow <30d, faded >30d)
- [ ] "Near Me" badge on stores within 5km
- [ ] Clickable store → open native maps (Apple Maps/Google Maps)

---

## 🟡 Medium Priority — Power Features

### Chart
- [ ] All Votes visualization (every vote as a dot on chart)
- [ ] My Vote dot on chart (separate from average)
- [ ] Color-coded vote dots (green=registered, gray=anonymous, gold=impersonated)
- [ ] Consistent product-name-hash color per dot

### Product Detail
- [ ] Rating labels (Excellent/Good/Fair/Poor per metric)
- [ ] Full admin voter list (scrollable, all votes with user ID, badges, delete, impersonate)
- [ ] Per-vote delete (admin)
- [ ] Per-vote impersonate (admin eye icon)

### Image Upload
- [ ] Client-side image resize + WebP conversion (1024px, 80%)
- [ ] Image dimension validation (min 200×200)
- [ ] Drag-and-drop upload

### Gamification
- [ ] Gamification toasts (points earned + badge unlocked, not just "vote success")
- [ ] Level progress bar (XP toward Elite Scout, 1000 XP)
- [ ] ScoutCard popover in header (points + badge summary)

### Backend
- [ ] Daily time-decay cron (0.5% daily decay)
- [ ] Time-decay weighted recalculation (0.9/year, min 0.1)
- [ ] Per-product time-decay recalculate (admin)
- [ ] Batch recalculate all products (admin)

---

## 🟢 Low Priority — Polish & Nice-to-Have

- [ ] Back image display on product page
- [ ] Context-aware nav (Back to Home / Scan Product)
- [ ] Chart ↔ list scroll-into-view sync
- [ ] Ad slot placeholder
- [ ] Report Product button
- [ ] Vibe-Check flow (post-scan landing page with VotingPanel)
- [ ] Location status icon in header (green/red)
- [ ] Migrations framework (@convex-dev/migrations)
- [ ] Sharded counter for high-concurrency vote counts

---

## ✅ Already Implemented (for reference)

These features are done in g-convex-v2 and should be preserved:

- [x] Safety vs Taste scatter chart (Recharts)
- [x] Quadrant background colors + corner labels
- [x] 3-option safety/taste quick vote
- [x] 4 combo quadrant presets (Holy Grail, Survivor Food, etc.)
- [x] Fine-tune sliders (0–100)
- [x] Draggable dot on coordinate grid
- [x] Weighted averages (registered 2×, anonymous 1×)
- [x] Rate limiting (10/min token bucket)
- [x] Vote migration (anonymous → registered)
- [x] Delete own vote
- [x] Text search by product name
- [x] Sort by vote count
- [x] Product image + stats + quadrant badge
- [x] AI-powered image analysis (Gemini 2.0 Flash)
- [x] Manual product entry (AddProductDialog)
- [x] Duplicate product detection
- [x] Admin dashboard + CRUD + toolbar + impersonation
- [x] Points, badges (7), streaks, leaderboard, profile
- [x] Geolocation hook + GPS on votes
- [x] i18n (EN/HU) + language switcher
- [x] Mobile hamburger menu
- [x] Loading skeletons
- [x] Responsive layout
- [x] Seed data script

---

*Last updated: February 2026*
