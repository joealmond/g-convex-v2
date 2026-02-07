# Future Features & Technology Decisions

Complete documentation of researched options and deferred features.

---

## 📊 File Storage Comparison

Research conducted Feb 2026. All options integrate with Convex.

| Solution | Storage | Egress | CDN | Best For |
|----------|---------|--------|-----|----------|
| **Convex Native** | $0.033/GB | $0.33/GB | ❌ | <1GB, simple apps |
| **Cloudflare R2** | $0.015/GB | ✅ Free | ✅ | Already on CF Workers |
| **Bunny.net (ConvexFS)** | $0.01/GB | ✅ Free | ✅ 119 PoPs | Global audience |
| **Transloadit** | $69/mo | Included | ✅ | Video processing |

### ✅ Current Decision: Convex Native
- Simple, zero config
- 1GB free tier sufficient for MVP
- Later: migrate to R2 if bandwidth costs increase

### ConvexFS / Bunny.net (Deferred)
- **What**: Virtual filesystem with global CDN
- **When**: If R2 latency becomes problem for global users
- **Docs**: https://convexfs.dev

### Transloadit (Deferred)
- **What**: Video/image processing with transcoding
- **When**: If video upload/processing is needed
- **Docs**: https://transloadit.com

---

## 📱 Mobile App Comparison

Research conducted Feb 2026.

| Solution | Stack | Effort | Best For |
|----------|-------|--------|----------|
| **Replit + Expo** | React Native | 🟢 Low | Fastest MVP |
| **Expo EAS** | React Native | 🟡 Med | Full control |
| **Capacitor** | Web → Native | 🟡 Med | Reuse web code |
| **Tauri v2** | Web + Rust | 🔴 High | Smallest bundles |

### ✅ Recommendation: Capacitor
- Reuses existing TanStack/React code
- Same TypeScript stack
- Native camera, GPS, push notifications
- PWA fallback works too

### Replit + Expo Notes
For vibe-coding a mobile app with Convex:
1. Prompt: "store all my data in a convex database"
2. Run: `npx convex dev` in Replit shell
3. Deploy: `npx convex deploy --cmd 'npx expo export -p web'`
4. Use `.env.production.local` for prod Convex URL

### Tauri v2 (Deferred)
- **What**: Desktop + mobile, Rust backend
- **When**: If bundle size becomes critical
- **Docs**: https://tauri.app

---

## 🔧 Backend Enhancements (Deferred)

### ShardedCounter
- **What**: Distributed counter for high write throughput
- **When**: Vote counts exceed ~100 writes/second
- **Docs**: https://convex.dev/components/sharded-counter

### Crons
- **What**: Scheduled tasks (streak reset, cleanup)
- **When**: Daily/weekly maintenance needed
- **Example**: See `g-convex/convex/crons.ts`

---

## 🗂️ Template Improvements (Deferred)

### Repository Rename
- Current: `convex-tanstack-cloudfare` (typo)
- Target: `convex-tanstack-cloudflare`
- **Blocker**: Update all external references

### Architecture Decision Records (ADRs)
Document these decisions:
- Why Better Auth over Clerk (self-hosted, data ownership)
- Why Cloudflare Workers over Vercel (edge-native, R2 integration)
- Why TanStack Start over Next.js (SSR patterns, portability)

---

## ✅ Implemented Features (from g-convex)

| Feature | Status |
|---------|--------|
| Gemini AI analysis | ✅ `convex/ai.ts` |
| Image upload dialog | ✅ `components/product/ImageUploadDialog.tsx` |
| createProductAndVote | ✅ `convex/votes.ts` |
| Stores array in schema | ✅ `convex/schema.ts` |
| Extended profile fields | ✅ gpsVotes, storesTagged, etc. |

## ⚪ Optional Features (Low Priority)

| Feature | Source | Notes |
|---------|--------|-------|
| product-vibe-chart | `g-convex/dashboard/` | Visual vote distribution |
| ad-slot component | `g-convex/dashboard/` | Monetization placeholder |
