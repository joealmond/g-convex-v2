# Mobile Testing Notes

> Results from Capacitor builds on iOS and Android.
> Tracks issues found, fixes applied, and remaining work.

## 📅 Testing History

### First Run (2025-02-10)
Both platforms loaded the app UI — SPA shell architecture works.

### Second Fix Pass (2025-02-12)
Applied safe area fixes, orientation lock, permissions, and native UX improvements.

---

## ✅ Fixed Issues

### Sign In / OAuth on Native (was P0 #1) — ✅ FIXED 2026-02-13
**Platform**: Both
**Root cause**: Multiple layered issues prevented OAuth from working on Capacitor:

1. **Google blocks WebView OAuth** — Capacitor's WKWebView is not a real browser, so Google rejects direct OAuth redirects. Fixed by using `better-auth-capacitor` which opens OAuth in the system browser via `ASWebAuthenticationSession`.

2. **Missing CORS preflight** — `@convex-dev/better-auth`'s `registerRoutes()` without the `cors` option only registers GET/POST handlers, no OPTIONS. Capacitor WebView at `capacitor://localhost` makes cross-origin requests to the Convex backend. Fixed by passing `cors` config with `capacitor-origin` and `x-skip-oauth-proxy` allowed headers.

3. **Wrong baseURL** — `SITE_URL="http://localhost:3000"` was used as Better Auth's `baseURL`, causing Google to redirect to `http://localhost:3000/api/auth/callback/google` which doesn't exist on the phone. Fixed by using `process.env.CONVEX_SITE_URL` (auto-set by Convex runtime).

4. **Missing Google redirect URI** — The Convex site URL (`https://<deployment>.convex.site/api/auth/callback/google`) was not added to Google Cloud Console's authorized redirect URIs.

5. **Session cookie not in callback URL** — This was the hardest bug. The `capacitor()` server plugin's after-hook reads `ctx.context.responseHeaders.get("set-cookie")` to append session cookies to the `gmatrix://` redirect URL. In the Convex runtime, Better Auth's OAuth callback throws an `APIError` (302 redirect) which **bypasses plugin after-hooks entirely**. The `set-cookie` header IS present on the final Response, but the hook never runs. **Fix**: Wrapped `auth.handler()` at the HTTP layer in `convex/http.ts` using a Proxy that post-processes 302 redirects to non-HTTP schemes, injecting the `set-cookie` value as a `?cookie=` query param directly on the redirect URL.

**Key files changed**:
- `convex/auth.ts` — baseURL from `CONVEX_SITE_URL`, `capacitor()` plugin, trusted origins
- `convex/http.ts` — Native OAuth Cookie Bridge (Proxy wrapper around `auth.handler()`)
- `src/lib/auth-client.ts` — `withCapacitor()` wrapper, native baseURL from `VITE_CONVEX_SITE_URL`
- `src/routes/login.tsx` — callbackURL `/auth/callback` for native
- `ios/App/App/Info.plist` — `CFBundleURLSchemes: gmatrix`

### Safe Area / Notch (was P1 #4)
**Problem**: TopBar overlapped with device status bar; content started at the very top.
**Fix applied**:
- TopBar now uses `safe-top` class with `env(safe-area-inset-top)` padding — header background extends behind status bar, interactive content stays below
- BottomTabs adds a `safe-bottom` spacer div for home indicator devices
- PageShell uses `calc(env(safe-area-inset-top) + 3rem)` for content offset
- Status bar style changed to `black-translucent` for immersive look

### Orientation Lock (was P2 #7)
**Problem**: App layout broke in landscape.
**Fix applied**:
- **iOS**: `Info.plist` — removed `UIInterfaceOrientationLandscapeLeft/Right` from `UISupportedInterfaceOrientations`
- **Android**: `AndroidManifest.xml` — added `android:screenOrientation="portrait"` to activity

### iOS Camera Crash (was P0 #1)
**Problem**: Missing `NSCameraUsageDescription` caused crash.
**Fix applied**: Added to `Info.plist`:
- `NSCameraUsageDescription`
- `NSPhotoLibraryUsageDescription`
- `NSPhotoLibraryAddUsageDescription`
- `NSLocationWhenInUseUsageDescription`

### Android Permissions (was P0 #3)
**Problem**: Missing permissions for camera/location in `AndroidManifest.xml`.
**Fix applied**: Added:
- `CAMERA`
- `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION`
- `READ_MEDIA_IMAGES` (API 33+)
- `READ_EXTERNAL_STORAGE` (API 32 and below, with maxSdkVersion)

### Viewport & Native Feel
**Fix applied**:
- Viewport meta: added `maximum-scale=1, user-scalable=no` (prevents pinch zoom on native)
- CSS: `overscroll-behavior: none` (prevents rubber-band effect)
- CSS: `touch-action: manipulation` (removes 300ms tap delay)
- CSS: `-webkit-tap-highlight-color: transparent` (removes blue flash on tap)
- CSS: `-webkit-user-select: none` on body (native feel), re-enabled on inputs/textareas
- Capacitor config: added StatusBar, Keyboard, SplashScreen plugin settings

---

## 🐛 Remaining Issues

### P0 — Critical

#### 1. Image Upload Not Working
**Platform**: Both (could select image but upload failed)
**Details**: Image selection via picker works, but the upload to Convex storage fails.
**Investigation needed**:
- Check if the upload endpoint URL is correctly resolved on native (should use `VITE_CONVEX_SITE_URL`)
- Check CORS headers on Convex HTTP endpoints for Capacitor origins
- Verify file handling in the upload mutation — native file URIs may differ from web File objects
- May need Capacitor Filesystem plugin to convert native URI to blob before upload

### P1 — UX Issues

#### 3. Bottom Navigation Touch Targets
**Platform**: Both (more severe on Android)
**Details**: Touch targets ~OK now with safe area fix, but may need further refinement after testing.
**Potential improvements**: Increase icon size to `h-7 w-7`, add more padding to tab items.

#### 4. Location Icon Not Responding
**Platform**: iOS
**Details**: GPS icon in TopBar doesn't respond. May need:
- Verify `@capacitor/geolocation` plugin is installed and synced
- Check if iOS location permission flow is triggering correctly
- Test with fresh install (permission prompt should appear)

### P2 — Nice to Have

#### 5. Status Bar Dynamic Styling
**Details**: Status bar text color should switch based on theme (light text on dark mode, dark text on light mode).
**Implementation**: Use Capacitor StatusBar plugin's `setStyle()` in the `useTheme` hook when theme changes.

#### 6. Haptic Feedback
**Details**: Add Capacitor Haptics plugin for tactile feedback on key interactions (voting, saving, tab switching).
**Priority**: Low — nice UX polish but non-essential.

#### 7. Swipe-Back Gesture (iOS)
**Details**: iOS users expect swipe-from-left-edge to go back. Capacitor may handle this automatically via WKWebView history, but needs testing.

---

## 📋 Remaining Fix Priority

1. ~~**Auth / OAuth flow**~~ ✅ Fixed (2026-02-13)
2. **Image upload on native** — May be related to file URI handling + CORS.
3. **Test safe area & orientation fixes** — Rebuild and verify on devices.
4. **Location permissions flow** — Test after fresh install.
5. **Status bar dynamic styling** — Theme-aware status bar text color.
6. **Haptics & polish** — After core features work.

---

## 📝 Technical Notes

### Build Architecture (Confirmed Working)
```
npm run build → vite build
  ├── SSR build → dist/server/ (Cloudflare Workers)
  └── SPA shell → dist/client/index.html (Capacitor)
    └── Prerender step: "[prerender] Prerendered 1 pages: /"

npx cap sync → copies to native projects
  ├── ios/App/App/public/ (18KB index.html + assets)
  └── android/app/src/main/assets/public/
```

### Capacitor Schemes (Current Config)
- iOS: `capacitor://localhost` (default — WKWebView)
- Android: `https://localhost` (default)
- Auth baseURL on native: `VITE_CONVEX_SITE_URL` (direct to Convex backend)
- `trustedOrigins`: includes both `capacitor://localhost` and `https://localhost`

---

## 🧠 Lessons Learned

### Convex + Better Auth + Capacitor OAuth (Critical Knowledge)

The combination of Convex runtime + Better Auth + Capacitor requires a **cookie bridge** at the HTTP layer. Here's why and how:

#### The Problem Chain
1. `better-auth-capacitor` opens OAuth in the system browser via `ASWebAuthenticationSession` (iOS) / Custom Tabs (Android)
2. After OAuth completes, Google redirects to `{CONVEX_SITE_URL}/api/auth/callback/google`
3. Better Auth's callback handler creates a session, sets `Set-Cookie` header, and redirects to `gmatrix://auth/callback`
4. The `capacitor()` server plugin has an after-hook that should read `set-cookie` from `responseHeaders` and append it as `?cookie=` on the redirect URL
5. **The hook never executes** — Better Auth throws an `APIError` with status 302 to perform the redirect, and this error bypasses all plugin after-hooks in the Convex runtime

#### The Fix: HTTP-Layer Cookie Bridge
In `convex/http.ts`, wrap `createAuth` with a Proxy that intercepts `auth.handler()`:

```typescript
const createAuthWithNativeBridge = (ctx) => {
  const auth = createAuth(ctx)
  return new Proxy(auth, {
    get(target, prop, receiver) {
      if (prop === 'handler') {
        return async (request: Request) => {
          const response = await target.handler(request)
          if (response.status !== 302) return response
          const location = response.headers.get('location')
          const setCookie = response.headers.get('set-cookie')
          if (!location || !setCookie) return response
          const url = new URL(location)
          if (url.protocol === 'http:' || url.protocol === 'https:') return response
          if (url.searchParams.has('cookie')) return response
          url.searchParams.set('cookie', setCookie)
          const newHeaders = new Headers(response.headers)
          newHeaders.set('location', url.toString())
          return new Response(null, { status: 302, headers: newHeaders })
        }
      }
      return Reflect.get(target, prop, receiver)
    },
  })
}
```

This works because the **final Response** from `auth.handler()` correctly has both `set-cookie` and `location` headers — even though the internal after-hooks can't see them.

#### Other Gotchas
- **baseURL must be `CONVEX_SITE_URL`** (auto-set by Convex runtime), NOT `SITE_URL` from `.env.local`
- **CORS must be enabled** via `registerRoutes(http, createAuth, { cors: { allowedHeaders: [...] } })` — without it, no OPTIONS handler is registered and Capacitor preflight requests fail
- **Google redirect URI** must include `{CONVEX_SITE_URL}/api/auth/callback/google` in Google Cloud Console
- **Plugin after-hooks are bypassed by APIError redirects** in Convex runtime — never rely on them for modifying 302 responses
- **The Proxy must use `Reflect.get`** for all non-handler properties to preserve `$context` getter (used by CORS trusted origins resolution)

### Safe Area Architecture
```
┌─── Status Bar (system) ──────────────────────┐
│ TopBar background extends INTO safe area      │ ← safe-top padding pushes content down
│ ┌─ TopBar interactive content ─────────────┐  │
│ │ [Logo]  [GPS] [Lang] [Theme] [Pts] [Usr] │  │ ← h-12 (48px) — below safe zone
│ └──────────────────────────────────────────-┘  │
│                                                │
│        Page Content (PageShell)                 │
│        paddingTop = safe-area-top + 3rem        │
│                                                │
│ ┌─ BottomTabs interactive content ─────────┐  │
│ │ [Home] [Board] [+] [Map] [Profile]       │  │ ← h-16 (64px)
│ └──────────────────────────────────────────-┘  │
│ BottomTabs background extends INTO home zone  │ ← safe-bottom spacer
└─── Home Indicator (system) ──────────────────┘
```
