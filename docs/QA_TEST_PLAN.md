# Manual QA & Release Testing Plan

Before releasing the app to real users or diving into automated E2E tests, it is critical to perform a manual "smoke test" of everything we have built. Since the core navigation, backend abstractions, and third-party plugins (Geospatial, R2 CDN, OneSignal, Sentry) have been completely overhauled, this checklist ensures they all interoperate correctly on a physical device.

---

## 📱 1. Core Navigation & UI Shell

- [ ] **Launch**: Open the app natively via Capacitor on a physical layout.
- [ ] **Dark Mode Toggle**: Go to Profile -> Settings -> Theme. Ensure toggling to Dark Mode instantly alters both the UI colors and the native device Status Bar.
- [ ] **App Shell Fluidity**: Tap through Bottom Tabs (Home, Community, Add, Map, Profile). Verify that routing is instantaneous and no infinite spinners appear.

## 📸 2. Smart Camera & Product Creation Flow

- [ ] **Native Permissions**: On a fresh install, tap `➕ Add`. The app must trigger native iOS/Android Camera and Location permission dialogs strictly once.
- [ ] **Barcode Scanner Detection**: Show a real product barcode to the camera. It should highlight the barcode and trigger a haptic buzz.
- [ ] **Open Food Facts Integration**: Once the barcode is scanned, does the app successfully lookup the standard name (or gracefully show a "Not Found" UI)?
- [ ] **AI Image Analysis**: Capture a food label image. Does the Gemini AI model analyze the text and automatically pre-fill the Safety, Taste, and Ingredients tags?
- [ ] **R2 CDN Uploads**: After hitting "Save Product", watch the network requests. Crucially, the image must upload directly to your Cloudflare R2 bucket (`r2.cloudflarestorage.com`), *not* Convex Storage.
- [ ] **Geospatial Storage**: After saving, navigate to the Map tab. The product should be visibly pinned exactly at your physical GPS coordinates.

## 🗳️ 3. Voting & Offline Capabilities

- [ ] **Standard Vote**: Tap a product's voting grid. Verify a standard vote registers and the Gamification toast ("+10 Points!") appears.
- [ ] **Offline Queue**: Turn on **Airplane Mode** (disconnect Wi-Fi/Cellular).
    - An `OfflineBanner` should immediately drop down securely.
    - Vote on a product. The UI should optimistically update and a `PendingSyncBadge` should appear above your tabs.
- [ ] **Online Sync Reconnect**: Turn Airplane Mode off. The pending sync queue should automatically drain in the background, pushing the queued vote to Convex.
- [ ] **Anonymous Migration**: 
    1. Log out (or clear storage). 
    2. Vote on a product anonymously. 
    3. Go to Profile and Sign In.
    4. Verify that the anonymous vote successfully migrated and is now tied to your registered user profile.

## 🌍 4. Social & Community

- [ ] **Nearby Feed Filter**: On the Home tab, switch the filter chip to **Nearby**. Verify that only products within your default radius appear. Change the radius slider in settings—the list should react instantly.
- [ ] **Comments & Threads**: Navigate to the `/community` route. Find a feed event and reply with a comment. "Like" a comment. Refresh the app to ensure your like persisted in Convex.
- [ ] **Follow System**: Follow a random user account. Verify that their subsequent votes and products now bubble up into your community feed.

## 🚨 5. Global Error Handling (Sentry)

- [ ] **Sentry Capture**: Purposely trigger a broken route or a malformed `useMutation` on the frontend.
- [ ] **Toast Grace**: The app should *not* white-screen. It should show a clean toast notification saying "Action Failed: Something went wrong."
- [ ] **Dashboard Check**: Open your `sentry.io` dashboard and verify that the unhandled exception was captured alongside the user's breadcrumbs and route state.
