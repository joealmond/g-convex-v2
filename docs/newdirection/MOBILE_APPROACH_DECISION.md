# Decision Record: Mobile App Approach

**Date:** 2025-02-08  
**Status:** Decided — **Capacitor**  
**Context:** Evaluated Replit + Expo (React Native) vs Capacitor after seeing a tutorial video on Replit's new mobile app publishing workflow with Convex integration.

---

## Options Evaluated

### Option A: Replit + Expo (React Native)

Replit introduced a guided mobile app workflow using Expo (React Native) with EAS (Expo Application Services) for cloud builds and App Store submission.

**How it works (from the tutorial):**

1. **Prompt Engineering** — Tell Replit's AI agent to "store all my data in a convex database" when generating the app. Without this, it defaults to Postgres/Drizzle.
2. **CLI Initialization** — Run `npx convex dev` in Replit's shell to connect the Convex backend. Requires browser auth flow to link the project.
3. **Production Build** — Override Replit's build command to: `npx convex deploy --cmd 'npx expo export -p web'`. This deploys Convex functions then exports the Expo web build.
4. **Secrets** — Generate a Convex deploy key (Dashboard → Settings → Deploy Keys), add as `CONVEX_DEPLOY_KEY` in Replit's Deployment Secrets. Create `.env.production.local` with the production Convex URL.
5. **Mobile Publishing** — Replit uses EAS to build native binaries. "Publish to App Store" initiates a managed Expo build. Requires Apple Developer Account. Replit attempts to manage provisioning profiles and certificates automatically.

**Pros:**
- No local tooling required (cloud builds via EAS)
- Guided publishing flow in Replit UI
- Good for greenfield apps built from scratch
- Convex has an official React Native client

**Cons:**
- **Requires complete rewrite** — Expo uses React Native (`<View>`, `<Text>`, `<ScrollView>`), not web HTML/CSS. None of our TanStack Start routes, shadcn/ui components, Tailwind CSS, Leaflet maps, or Recharts would work.
- **Two separate codebases** to maintain (web + mobile)
- **Vendor lock-in** to Replit for development, builds, and deployment
- **No SSR support** — React Native is client-only
- React Native ecosystem is different from web ecosystem (different libraries for maps, charts, etc.)

### Option B: Capacitor (Selected)

Capacitor wraps our existing web app in a native shell (WKWebView on iOS, WebView on Android), providing access to native APIs via plugins.

**How it works:**

1. **Install** — `npm i @capacitor/core @capacitor/ios @capacitor/android && npm i -D @capacitor/cli`
2. **Init** — `npx cap init` (creates `capacitor.config.ts`)
3. **Build web** — `npm run build` (standard Vite build)
4. **Sync** — `npx cap sync` (copies web assets to native projects)
5. **Run** — `npx cap run ios` / `npx cap run android` (or open in Xcode/Android Studio)
6. **Publish** — `npx cap build ios` / `npx cap build android` → standard App Store / Play Store submission

**Pros:**
- **Zero rewrite** — Our TanStack Start app runs as-is inside the native shell
- **One codebase** for web (PWA) + iOS + Android
- **Full control** — VS Code + GitHub + Cloudflare Workers, no platform lock-in
- Capacitor plugins for native APIs (camera, GPS, haptics, push notifications)
- First-class PWA support alongside native apps
- Tailwind, shadcn/ui, Leaflet, Recharts — everything works unchanged
- TanStack Start SSR works on web; Capacitor serves the client build on native

**Cons:**
- Requires Xcode (free, macOS only) for iOS builds
- Requires Android Studio for Android builds
- App Store submission is manual (no guided UI like Replit)
- WebView performance slightly lower than true native (negligible for our use case)

---

## App Store Publishing Process (Same for Both)

Regardless of build approach, the App Store submission process is identical:

| Requirement | Details |
|---|---|
| Apple Developer Program | $99/year, ~24h approval wait after signup |
| Google Play Console | $25 one-time fee |
| App icons | 1024×1024px source → generate all sizes |
| Splash screens | Per-platform, generated from source image |
| TestFlight (iOS beta) | Upload IPA → invite testers → gather feedback |
| App Store submission | Fill metadata in App Store Connect → submit for Apple review (1-3 days) |
| Google Play submission | Upload AAB in Play Console → fill store listing → submit for review |
| Certificates (iOS) | Signing certificates + provisioning profiles (max 2 active distribution certs) |

---

## Decision Rationale

1. **We already have a working web app.** Replit+Expo's value is for building from scratch with AI. We have a complete TanStack Start + Convex + Tailwind + shadcn/ui codebase.

2. **Rewriting in React Native would double the work** with zero code reuse from our web app.

3. **Capacitor preserves our entire stack** — routes, components, hooks, styles, Convex queries — unchanged.

4. **The hard part of mobile publishing is App Store/Play Store processes** (certificates, metadata, review), which is identical regardless of wrapper technology.

5. **No vendor lock-in** — Capacitor is open source (MIT), maintained by Ionic/OutSystems.

6. **We have a Mac** — Xcode is available, so the "no local tooling" advantage of Replit is moot.

---

## References

- Replit mobile docs: https://docs.replit.com/replitai/building-mobile-apps
- Replit + Expo tutorial: https://docs.replit.com/tutorials/expo-on-replit
- Capacitor docs: https://capacitorjs.com/docs
- Capacitor iOS deployment: https://capacitorjs.com/docs/ios/deploying-to-app-store
- Capacitor Android deployment: https://capacitorjs.com/docs/android/deploying-to-google-play
- Convex React Native client: https://docs.convex.dev/client/react-native
- Convex TanStack Start quickstart: https://docs.convex.dev/quickstart/tanstack-start
