# Future Plans

Items that need more planning and need to be broken down into smaller tasks before implementation.

> See also: [REDESIGN_PLAN.md](REDESIGN_PLAN.md), [MOBILE_APPROACH_DECISION.md](MOBILE_APPROACH_DECISION.md), [MOBILE_TESTING_NOTES.md](MOBILE_TESTING_NOTES.md)

---

## 📱 Mobile (Capacitor)

Capacitor builds work on both iOS and Android but have critical bugs from initial testing.

### Camera & Image Upload
- Fix iOS camera crash — add `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` to `Info.plist`
- Fix Android camera — verify permissions in `AndroidManifest.xml` and Capacitor Camera plugin config
- Add client-side image resize + WebP conversion before upload (1024px, WebP 80%)
- Add image dimension validation (min 200×200)

### OAuth on Native
- Google OAuth redirects don't work from `capacitor://localhost`
- Research options: In-App Browser with deep links, custom scheme redirect, or native Google Sign-In SDK (`@codetrix-studio/capacitor-google-auth`)
- This is the most complex mobile integration — needs a dedicated spike

### UI / UX Fixes
- Safe area insets: top bar overlaps status bar on both platforms — use `env(safe-area-inset-top/bottom)` with `viewport-fit=cover`
- Bottom navigation touch targets too small on phones — enforce 44×44px minimum
- Lock orientation to portrait (iOS: Xcode settings, Android: `AndroidManifest.xml`)
- Test dark mode rendering on native WebView — set `StatusBar.setStyle()` per theme

### Cross-Device Consistency
- Replace `100vh` with `100dvh` for full-screen layouts (fixes mobile address bar issue)
- Use `clamp()` for fluid typography: `clamp(0.875rem, 2.5vw + 0.5rem, 1.125rem)`
- Use container queries for component-level responsiveness (product cards, chart containers)
- Test on minimum 3 device sizes: iPhone SE (375px), iPhone 15 (393px), iPhone 16 Pro Max (430px)

### Push Notifications
- Set up Firebase Cloud Messaging (FCM) with `@capacitor/push-notifications`
- iOS: enable Push capability in Xcode, configure APNs
- Android: add `google-services.json` from Firebase Console
- Store device tokens in Convex for server-triggered notifications

### Deep Linking
- Set up Universal Links (iOS) and App Links (Android) so product URLs open in-app
- Create `apple-app-site-association` and `assetlinks.json` on web server
- Handle deep links with Capacitor `App.addListener('appUrlOpen', ...)`

### Accessibility
- Add `aria-label` to all icon-only buttons
- Use `rem` units for text, not `px` — respects system font size preferences
- Test with VoiceOver (iOS) and TalkBack (Android)
- Honor `prefers-reduced-motion` CSS media query

### Offline Handling
- Convex auto-reconnects on brief network blips
- Add offline status banner using `navigator.onLine` + event listeners
- Consider optimistic updates for voting to feel instant

---

## 🏗️ Architecture

### Niche-Agnostic Refactor
- Create `src/lib/app-config.ts` with all niche-specific terms (app name, dimensions, quadrant names, colors, store defaults)
- Replace all hardcoded "gluten-free" / "celiac" references with config values
- Generalize `containsGluten` → `containsRiskIngredient` in schema and components
- Make quadrant names, rating labels, and risk concepts configurable

### Mobile-First Layout
- Replace desktop `Navigation.tsx` with `TopBar.tsx` (minimal: logo + auth avatar)
- Create `BottomTabs.tsx` (4 icons: Home, Leaderboard, Add, Profile)
- Redesign home page as feed-based view with filter chips + product card grid
- Add toggle between feed view and scatter chart view

### Feed & Discovery
- Design `ProductCard.tsx` for feed (safety dots, image, name, distance, quadrant badge)
- Add `ProductMap.tsx` with Leaflet (product pins colored by quadrant)
- Create `/map` route with filter chips

---

## ⚙️ Backend

### Time-Decay System
- Implement daily cron job (0.5% daily decay on vote weights)
- Add time-decay weighted recalculation (0.9/year factor, min 0.1 weight)
- Add admin tools: per-product recalculate, batch recalculate all

### Scaling
- Evaluate sharded counters for high-concurrency vote counts (only needed at ~100+ writes/sec)
- Set up `@convex-dev/migrations` framework for schema evolution

### Data Quality
- Add duplicate product detection improvements
- Implement "Report Product" functionality
- Add admin voter list with per-vote delete and impersonate actions

---

## 💾 Storage & Media

### Image Pipeline
- Current: raw file upload to Convex storage (10MB limit)
- Target: client-side resize → WebP → upload (reduces bandwidth ~70%)
- Future: migrate to Cloudflare R2 if Convex storage costs increase (free egress)
- Consider Bunny.net/ConvexFS for global CDN if latency is an issue

### Drag-and-Drop Upload
- Add drag-and-drop support to `ImageUploadDialog.tsx`

---

## 💰 Monetization (Deferred)

- Ad slot placeholder component (from original g-matrix)
- Premium features (TBD)

---

## 🛠️ Developer Experience

### Template Upstream
- Contribute battle-tested patterns back to `convex-tanstack-cloudflare` template
- Document `expectAuth: true` gotcha for apps with anonymous features
- Add Cloudflare Workers gotchas section (dynamic `import.meta.env`, no `Buffer`)

### Testing
- Add integration tests for voting flow (anonymous → registered migration)
- Add E2E tests for product creation + AI analysis pipeline
- Test SSR hydration on Cloudflare Workers with auth state

---

*Last updated: February 2026*
