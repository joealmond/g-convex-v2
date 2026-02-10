# Architecture Action Plan

> Based on [Architecture Review](../../architecture_review.md) findings. Prioritized into **Fix Now** (before next feature work) and **Deferred** (backlog).

---

## 🔴 Fix Now — Security & Critical Gaps

These should be addressed before shipping any new features.

### Security Fixes

- [x] **Add admin check to `products.deleteProduct`** — currently any authenticated user can delete any product. Use `requireAdmin(ctx)` from `lib/authHelpers.ts`
- [x] **Add admin check to `profiles.addPoints`** — currently any logged-in user can award points. Use `requireAdmin(ctx)`
- [x] **Add admin check to `profiles.resetStreak`** — same issue. Use `requireAdmin(ctx)`
- [x] **Standardize auth pattern** — migrate all mutations from raw `ctx.auth.getUserIdentity()` to `requireAuth` / `requireAdmin` / `getAuthUser` helpers. Files: `products.ts` (`update`, `deleteProduct`), `votes.ts` (`deleteVote`)
- [x] **Update `better-auth` to ≥1.4.18** — CVE-2025-61928 (unauthenticated API key creation) patched in 1.3.26+

### Performance — Quick Wins

- [x] **Add compound index `['productId', 'userId']` on `votes`** — `cast()` currently scans all product votes to find existing user vote. One-line schema change, huge read improvement
- [x] **Add `by_points` index on `profiles`** — leaderboard currently does `.collect()` + JS sort on every render. Change to `.withIndex('by_points').order('desc').take(limit)`

### Cleanup

- [x] **Remove `messages` table** from `schema.ts` — marked "to be removed in Phase 3", still present
- [x] **Remove duplicate `recalculateAverages`** mutation from `products.ts` — unused, replaced by internal `recalculateProduct` in `votes.ts`

---

## 🟡 Deferred — Scalability & Quality

Address these during regular feature work or as dedicated tech-debt sprints.

### Search & Pagination (before 500+ products)

- [x] Replace `products.search()` JS string filter with Convex search index or optimized query
- [x] Add cursor-based pagination (`.paginate()`) to `products.list()` — currently `.collect()` on all products
- [x] Add pagination to `profiles.leaderboard()` — currently loads all profiles
- [x] Optimize `follows.getCounts()` and `reports.getReportCount()` — currently collect just to count

### Rate Limiting Expansion

- [x] Add rate limit to `reports.create` — only has 24h duplicate check, no actual rate limit
- [x] Add rate limit to `follows.follow` — no protection against follow spam
- [x] Add rate limit to `products.update` — no protection against edit spam

### Bundle & Performance

- [x] Add `recharts` as a separate manual chunk in `vite.config.ts`
- [x] Lazy-load `leaflet` / `react-leaflet` — only used on map page
- [x] ~~Lazy-load `framer-motion` where not critical for initial render~~ — Evaluated: framer-motion is imported across 10+ components (feed, product, dashboard, layout), making lazy-loading impractical without major refactoring. Deferred.
- [x] Evaluate `staleTime: 5min` interaction with Convex real-time push — Evaluated: Convex's `ConvexQueryClient` pushes real-time updates through React Query regardless of `staleTime`. The 5min setting only affects non-Convex queries. No change needed.

### Backend Robustness

- [x] Batch `recalculateAllProducts` cron — now processes in batches of 25 with staggered scheduling
- [x] Add retry logic to `ai.ts` Gemini calls on 429 errors — up to 3 retries with exponential backoff
- [x] Use `v.union(v.literal(...))` for string enum fields (`status`, `role`, `type`) for compile-time type safety

### Code Quality

- [x] Add unit tests for `lib/gamification.ts` (`shouldAwardBadge`, `calculateVotePoints`) — 29 tests
- [ ] Add integration tests for vote cast → recalculate → average update flow
- [ ] Add integration test for anonymous → registered vote migration
- [x] Extract large route files (`index.tsx` 377→303 lines) — filtering/sorting logic extracted to `use-product-filter.ts` hook

### Documentation

- [x] Document the dual SSR/SPA architecture in `ARCHITECTURE.md`
- [x] Document the `app-config.ts` niche configuration pattern → `NICHE_CONFIG_GUIDE.md`
- [x] Add ADR (Architecture Decision Record) for Better Auth choice over Clerk → `ADR-001-BETTER-AUTH.md`
- [x] Document time-decay algorithm and settings → `TIME_DECAY.md`
- [x] Add runbook for making a user admin → `ADMIN_RUNBOOK.md`

---

## Cross-Reference

| Area | This Plan | PRIORITY_CHECKLIST.md |
|---|---|---|
| Security | ✅ Covered here | Not covered |
| Performance | ✅ Covered here | Not covered |
| Chart features | See checklist | ✅ Covered there |
| Voting UX | See checklist | ✅ Covered there |
| Filtering & Search | Overlaps (search perf) | ✅ Covered there (UX) |
| Product detail UX | See checklist | ✅ Covered there |
| Gamification UX | See checklist | ✅ Covered there |
| Image upload | See checklist | ✅ Covered there |

> **This plan focuses on architecture, security, and infrastructure.** Feature UX work remains in [PRIORITY_CHECKLIST.md](./PRIORITY_CHECKLIST.md).

---

*Created: February 2026 — from architecture review*
