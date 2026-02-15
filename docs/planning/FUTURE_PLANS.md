# Future Plans

> Items that need more research, planning, or design work before they become action items.
> Once planned, move them to [ACTION_PLAN.md](./ACTION_PLAN.md).

---

## 📱 Mobile Native (Capacitor)

### Deep Linking
- Universal Links (iOS) + App Links (Android) so product URLs open in-app
- Create `apple-app-site-association` and `assetlinks.json` on web server
- Handle via `App.addListener('appUrlOpen', ...)`

### Cross-Device Consistency
- Replace `100vh` with `100dvh` for full-screen layouts
- Use `clamp()` for fluid typography
- Use container queries for component-level responsiveness
- Test on minimum 3 device sizes: iPhone SE (375px), iPhone 15 (393px), iPhone 16 Pro Max (430px)

### Accessibility
- Add `aria-label` to all icon-only buttons
- Use `rem` units for text, not `px`
- Test with VoiceOver (iOS) and TalkBack (Android)
- Honor `prefers-reduced-motion` CSS media query

---

## 🍽️ Restaurant & Dining

### Restaurant Entity
- Add restaurant/dining entity to schema
- User reviews for restaurants (separate from product reviews)
- "Dedicated GF kitchen" filter
- "Safe restaurants near me" map view (extend existing map)
- City-specific restaurant guides (like Spokin)

---

## 📊 Data & Analytics

### Symptom/Reaction Tracking
- "How did this product make you feel?" post-consumption log
- Symptom diary linked to products
- Pattern insights ("Products from Store X cause more reactions")

### Data Quality
- Improve duplicate product detection
- Cron job: clear/merge duplicate data, group similar products for admin review

---

## 📚 Content & Education

### Educational Content Hub
- "What is Celiac?" beginner guide
- Hidden gluten ingredients glossary
- Tips for dining out, traveling
- AI chat assistant (CeliaChat equivalent)

### Multi-Language Gluten Card
- Printable/showable "I have celiac disease" card in 50+ languages
- Useful for travel

### Recipes & Meal Planning
- Recipe suggestions using rated products
- Weekly meal plan with GF products
- Shopping list from rated products

---

## 🏗️ Architecture

### Store Profiles
- Store pages with all products found there (route `store/$name` exists, needs content)
- Store safety ratings
- User-submitted store photos
- More products with same location on map (grouped markers)

### Chat on Product
- Real-time chat/discussion thread on product pages
- Users asking questions, sharing tips about specific products

### Text Reviews & Star Ratings
- Full text reviews on products (not just numeric votes)
- Star-based product rating alongside the 2-axis system

### Image Hosting & CDN
- Evaluate migrating from Convex storage to Cloudflare R2 (free egress)
- Set up Cloudflare CDN for image delivery

### Scaling
- Evaluate sharded counters for high-concurrency vote counts (100+ writes/sec)
- Set up `@convex-dev/migrations` framework for schema evolution

---

## 💰 Monetization (Deferred)

- Ad slot placeholder component
- Premium features (offline mode, advanced filters, ad-free)
- Affiliate product links to retailers
- Sponsored product placements
- Store subscriptions (stores pay to manage profiles)
- Data insights (anonymized trend reports to manufacturers)

---

## 🛠️ Developer Experience

### Observability
- Add structured logging
- Integrate Sentry for error tracking
- PostHog for product analytics
- User analytics, retention metrics

### Template Upstream
- Contribute battle-tested patterns back to `convex-tanstack-cloudflare` template
- Document `expectAuth: true` gotcha for apps with anonymous features
- Add Cloudflare Workers gotchas section

### Onboarding
- First-time user tutorial / walkthrough
- "Scan your first product" CTA
- Gamification intro ("Here's how you earn badges")

---

## 📋 Reference Documents

These files have been moved to `references/` for historical context:

| File | Content |
|------|---------|
| [REDESIGN_PLAN.md](./references/REDESIGN_PLAN.md) | Full mobile-first redesign specification |
| [MOBILE_APPROACH_DECISION.md](./references/MOBILE_APPROACH_DECISION.md) | ADR: Capacitor vs React Native |
| [MOBILE_TESTING_NOTES.md](./references/MOBILE_TESTING_NOTES.md) | Capacitor testing results, OAuth fix, safe area architecture |
| [COMPETITIVE_ANALYSIS.md](./references/COMPETITIVE_ANALYSIS.md) | Feature gap analysis vs 10+ competitor apps |
| [gmatrix_app_summary.md](./references/gmatrix_app_summary.md) | Original Kimi design spec |
| [gmatrix_design_system.md](./references/gmatrix_design_system.md) | Design system reference |

---

*Last updated: February 2026*
