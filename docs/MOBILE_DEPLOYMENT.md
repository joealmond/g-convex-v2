# Mobile Deployment Guide (iOS & Android)

This guide covers deploying G-Matrix to iOS and Android devices using Capacitor. It includes platform-specific issues, workarounds, and testing procedures learned from production deployment.

## Prerequisites

| Tool | Version | Installation |
|------|---------|-------------|
| Xcode | 14.1+ | Mac App Store |
| Android Studio | Flamingo+ | https://developer.android.com/studio |
| CocoaPods | Latest | `sudo gem install cocoapods` |
| Node.js | 18+ | https://nodejs.org |
| Capacitor CLI | 8.x | `npm install -g @capacitor/cli` |

## Architecture Overview

```
TanStack Start SSR Framework
         ↓
   [SPA Mode Enabled]
         ↓
    npm run build
         ├─→ dist/server/ (Cloudflare Workers — web deployment)
         └─→ dist/client/ (Static SPA shell — mobile apps)
                 ↓
            npx cap sync
                 ├─→ ios/App/App/public/ (iOS WebView)
                 └─→ android/app/src/main/assets/public/ (Android WebView)
```

**Key Insight**: The same codebase generates both SSR (web) and SPA (mobile) builds via TanStack Start's dual-target system.

---

## Initial Setup (One-Time)

### 1. Install Dependencies
```bash
npm install
```

Postinstall script automatically patches Capacitor Android plugins for AGP 9.x compatibility.

### 2. Configure Environment Variables

**Required for native OAuth:**
- `CONVEX_SITE_URL` — Your Convex deployment URL (e.g., `https://fabulous-horse-363.convex.cloud`)
- `VITE_CONVEX_SITE_URL` — Same value, used by client-side native auth

**Add to `.env.local`:**
```bash
CONVEX_SITE_URL=https://your-convex-site.convex.cloud
VITE_CONVEX_SITE_URL=https://your-convex-site.convex.cloud
```

### 3. Build the App
```bash
npm run build
```

Output:
- `dist/server/` — SSR bundle (ignored by Capacitor)
- `dist/client/` — SPA shell with `index.html` (used by Capacitor)

---

## iOS Deployment

### Step 1: Sync Project
```bash
npx cap sync ios
```

This copies `dist/client/` to `ios/App/App/public/`.

### Step 2: Open in Xcode
```bash
npx cap open ios
```

### Step 3: Configure Signing
1. In Xcode, select the **App** target
2. Go to **Signing & Capabilities**
3. Select your **Team** (Apple Developer account)
4. Ensure **Bundle Identifier** matches your provisioning profile (e.g., `com.gmatrix.app`)

### Step 4: Choose Build Configuration

**Debug Mode** (Development):
- Shows verbose logs: Capacitor bridge logs, better-auth session tokens
- Good for debugging, **BAD for security** (tokens visible in console)
- Use during active development only

**Release Mode** (Testing/Production):
- Minimal logging, no sensitive data exposed
- Recommended for all testing and production builds

**To Switch:**
1. Click scheme dropdown (next to Stop button) → **Edit Scheme...**
2. Under **Run** → **Info** → **Build Configuration** → Select **Debug** or **Release**
3. Close and run

### Step 5: Select Device & Run
1. In the top toolbar, select a device:
   - Physical device (recommended for GPS testing)
   - Simulator (no GPS, mock location required)
2. Click ▶️ **Run** button (Cmd+R)

### iOS Known Issues

#### 🚨 UIScene Lifecycle Warnings (Harmless)
```
UISceneConfigurationName key doesn't exist in the Info.plist
```
**Cause**: App uses traditional AppDelegate, not SceneDelegate.  
**Impact**: None — warnings are cosmetic.  
**Do NOT fix by adding SceneDelegate** — Capacitor v8 is incompatible (causes black screen).

#### 🚨 Verbose Logging in Debug Builds
```
⚡️  To Native -> Geolocation getLocation 12345678
Session token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Cause**: iOS Debug configuration enables detailed logs.  
**Solution**: Use Release configuration (see Step 4 above).  
**Cannot be disabled via code** — controlled by Xcode build settings.

#### 🚨 Camera Wizard Issues
**Symptom**: Camera buttons unresponsive, camera stays open after close, or camera restarts after submit.

**Root Causes & Solutions**:
1. **Buttons unresponsive**: Radix Dialog `modal={true}` adds `inert` to portaled overlay. Fix: `modal={false}` on native.
2. **Camera stays open**: `stopCamera()` not awaited. Fix: `await stopCamera()` before dialog close.
3. **Camera restarts**: `resetDialog()` sets step back to `'wizard'`. Fix: only set step to `'wizard'` in the open handler.
4. **`FigCaptureSourceRemote err=-17281` crash**: Plugin v2.0.0 bug. Fix: update to `capacitor-camera-view` v2.0.2+.

**Full Reference**: See `docs/CAMERA_WIZARD.md` for complete architecture guide.

#### 🚨 Black Screen on Launch
**Cause**: SceneDelegate was added to `AppDelegate.swift` or `Info.plist`.  
**Solution**:
1. Remove `UISceneSession` lifecycle methods from `AppDelegate.swift`
2. Remove `UIApplicationSceneManifest` from `Info.plist`
3. Delete `SceneDelegate.swift` if it exists
4. Ensure `AppDelegate` has `var window: UIWindow?` property
5. Clean build folder: **Product → Clean Build Folder** (Cmd+Shift+K)

**Reference**: Capacitor GitHub issues [#6662](https://github.com/ionic-team/capacitor/issues/6662), [#7961](https://github.com/ionic-team/capacitor/issues/7961)

---

## Android Deployment

### Step 1: Sync Project
```bash
npx cap sync android
```

Output should show: `✔ Sync finished in ~0.5s` with 11 Capacitor plugins detected.

### Step 2: Open in Android Studio
```bash
npx cap open android
```

### Step 3: Gradle Sync
Android Studio should auto-sync. If not:
1. Click **File → Sync Project with Gradle Files**
2. Wait for sync to complete (~30-60 seconds)

### Step 4: Verify ProGuard Patches Applied
If you see errors like:
```
getDefaultProguardFile('proguard-android.txt') is no longer supported
```

**Fix:**
```bash
bash scripts/patch-capacitor-android.sh
npx cap sync android
```

Then re-sync in Android Studio: **File → Sync Project with Gradle Files**.

### Step 5: Select Device & Run
1. In top toolbar, select a device:
   - Physical device via USB (enable **Developer Options** + **USB Debugging**)
   - Emulator (AVD Manager → Create/Start virtual device)
2. Click green ▶️ **Run** button

### Android Known Issues

#### 🚨 ProGuard AGP 9.x Compatibility Errors
**Symptom**: Build fails with `proguard-android.txt is no longer supported`.  
**Affected plugins**: camera, geolocation, share, haptics, better-auth-capacitor, capacitor-camera-view.  
**Solution**: Automated via `scripts/patch-capacitor-android.sh` (runs on `npm install`).

**Manual Verification:**
```bash
grep "proguard-android" node_modules/@capacitor/haptics/android/build.gradle
```
Should show `proguard-android-optimize.txt` (not `proguard-android.txt`).

**If a new plugin fails**: Add its path to `PLUGINS` array in `scripts/patch-capacitor-android.sh`.

#### 🚨 Gradle Deprecation Warnings (Harmless)
```
The option setting 'android.usesSdkInManifest.disallowed=false' is deprecated.
```
**Cause**: Capacitor-generated build configuration uses deprecated Gradle options.  
**Impact**: None — warnings won't prevent build or runtime.  
**Fix**: Will be resolved in Capacitor 9.x (requires migration).

#### 🚨 Location Not Working in Emulator
**Cause**: Android emulators don't have real GPS hardware.  
**Solution**: Set mock location via Extended Controls:

1. Click **"..."** (More) button on emulator sidebar
2. Select **Location**
3. Enter coordinates:
   - **Budapest**: `47.4979, 19.0402`
   - **Biatorbágy**: `47.4725, 18.8178`
   - **Vienna**: `48.2082, 16.3738`
4. Click **Send**

**Or via command line:**
```bash
adb emu geo fix 19.0402 47.4979  # longitude latitude order
```

**Reference**: See `docs/ANDROID_EMULATOR_LOCATION.md` for detailed guide.

---

## Common Issues (Both Platforms)

### 🚨 OAuth Sign-In Fails
**Cause**: OAuth provider (Google) blocks WebView authentication.  
**Solution**: App uses `better-auth-capacitor` which opens system browser (Safari/Chrome) via deep links.

**Checklist**:
- ✅ `VITE_CONVEX_SITE_URL` set in `.env.local`
- ✅ `trustedOrigins` in `convex/auth.ts` includes `capacitor://localhost` (iOS) and `https://localhost` (Android)
- ✅ Google Cloud Console has `{CONVEX_SITE_URL}/api/auth/callback/google` as authorized redirect URI
- ✅ Deep link scheme configured: `gmatrix://` in `Info.plist` + `AndroidManifest.xml`

**Test**: Tap "Sign in with Google" → System browser opens → Auth completes → App resumes with session.

### 🚨 Map Pinch Gestures Don't Work (Desktop Testing)
**Cause**: Leaflet pinch-to-zoom is designed for touch screens, not trackpads.  
**Workaround**: MacBook users should use:
- **Scroll wheel** (two-finger scroll on trackpad)
- **Double-click** to zoom in
- **Shift+Drag** to box-zoom an area
- **+/−** buttons on map

**On phone/tablet**: Pinch-to-zoom works perfectly.

**Code Pattern**: Always enable all zoom methods in `MapContainer`:
```tsx
<MapContainer
  scrollWheelZoom={true}
  doubleClickZoom={true}
  touchZoom={true}
  boxZoom={true}
  keyboard={true}
>
```

### 🚨 Safe Area Issues (Notch/Home Indicator)
**Symptom**: Content is cut off by notch or hidden under home indicator.  
**Solution**: Use `env(safe-area-inset-*)` CSS variables:

```css
/* TopBar extends behind status bar, content below */
.safe-top {
  padding-top: env(safe-area-inset-top);
}

/* BottomTabs fills home indicator area */
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Page content offset */
.page-content {
  padding-top: calc(env(safe-area-inset-top) + 3rem);
}
```

**Also ensure `viewport-fit=cover` in `index.html`:**
```html
<meta name="viewport" content="... viewport-fit=cover">
```

---

## Testing Checklist

### iOS
- [ ] OAuth sign-in via Google (system browser opens)
- [ ] Location permission prompt appears
- [ ] Map centers on user location
- [ ] Camera/image upload works
- [ ] "Nearby" filter shows products within range
- [ ] Voting records GPS coordinates
- [ ] Safe areas respected (no notch cutoff)
- [ ] Dark mode toggles correctly
- [ ] No session tokens in Release build logs

### Android
- [ ] OAuth sign-in via Google (Chrome Custom Tab opens)
- [ ] Location permission prompt appears
- [ ] Mock location set in emulator (see `docs/ANDROID_EMULATOR_LOCATION.md`)
- [ ] Map shows products
- [ ] Camera/image upload works
- [ ] "Nearby" filter shows products within range
- [ ] Voting records GPS coordinates
- [ ] No ProGuard build errors
- [ ] Dark mode toggles correctly

---

## Build for Production

### iOS App Store
1. Switch to **Release** configuration (no Debug logs!)
2. In Xcode, select **Any iOS Device (arm64)** as target
3. **Product → Archive**
4. Upload to App Store Connect via Xcode Organizer
5. Submit for TestFlight or App Store review

### Google Play Store
1. Generate release keystore (one-time):
   ```bash
   keytool -genkey -v -keystore g-matrix-release.keystore \
     -alias g-matrix -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Configure signing in `android/app/build.gradle` (see Android docs)
3. Build release APK/AAB:
   ```bash
   cd android
   ./gradlew bundleRelease  # For Play Store (AAB)
   # OR
   ./gradlew assembleRelease  # For direct install (APK)
   ```
4. Output: `android/app/build/outputs/bundle/release/app-release.aab`
5. Upload to Google Play Console

---

## Troubleshooting

### Clean Build (iOS)
```bash
cd ios/App
pod deintegrate
pod install
# In Xcode: Product → Clean Build Folder (Cmd+Shift+K)
```

### Clean Build (Android)
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### Reset Capacitor State
```bash
rm -rf dist/
rm -rf ios/App/App/public/
rm -rf android/app/src/main/assets/public/
npm run build
npx cap sync
```

### Check Capacitor Doctor
```bash
npx cap doctor
```

Verifies Capacitor environment, dependencies, and configuration.

---

## Reference Documentation

| Topic | File |
|-------|------|
| iOS Logging | `docs/IOS_LOGGING.md` |
| Android Emulator GPS | `docs/ANDROID_EMULATOR_LOCATION.md` |
| Capacitor Config | `capacitor.config.ts` |
| ProGuard Patch Script | `scripts/patch-capacitor-android.sh` |
| Native Auth Setup | `convex/auth.ts`, `src/lib/auth-client.ts` |
| Platform Detection | `src/lib/platform.ts` |

---

## Upstream Contributions (For Template Repos)

This project has pioneered patterns that could benefit other TanStack Start + Capacitor + Better Auth projects:

### 1. **ProGuard AGP 9.x Compatibility Pattern**
- **Problem**: Capacitor v8 plugins use deprecated `proguard-android.txt`
- **Solution**: Automated postinstall script patches `node_modules/` on `npm install`
- **Upstream Value**: Generic script that works for any Capacitor v8 project
- **Target**: TanStack Start + Capacitor templates, Better Auth Capacitor docs

### 2. **Native OAuth Cookie Bridge Architecture**
- **Problem**: better-auth-capacitor's after-hook doesn't execute in Convex runtime (APIError bypasses hooks)
- **Solution**: HTTP Proxy wrapper at Convex layer injects session cookie into deep link redirect URL
- **Upstream Value**: Reference implementation for Convex + Better Auth + Capacitor combination
- **Target**: Better Auth docs, Convex examples repo

### 3. **SPA Mode Configuration for Hybrid Apps**
- **Problem**: TanStack Start is SSR-first, Capacitor needs static `index.html`
- **Solution**: SPA Mode with `spa.prerender.outputPath: '/index.html'` generates dual builds
- **Upstream Value**: Documented pattern for hybrid web/mobile deployments
- **Target**: TanStack Start documentation, Capacitor integrations

### 4. **iOS SceneDelegate Incompatibility Documentation**
- **Problem**: Capacitor v8 + SceneDelegate = black screen, no error
- **Solution**: Traditional AppDelegate pattern, remove UIApplicationSceneManifest
- **Upstream Value**: Saves hours of debugging for other developers
- **Target**: Capacitor documentation, GitHub issue comments

### 5. **Map Gesture Configuration for Desktop/Mobile**
- **Problem**: Leaflet pinch-to-zoom only works on touch screens
- **Solution**: Enable all zoom methods (scroll, double-click, box-zoom, keyboard, touch)
- **Upstream Value**: Better UX for Leaflet maps in hybrid apps
- **Target**: react-leaflet documentation, Capacitor examples

---

## Questions?

**iOS Issues**: Check `docs/IOS_LOGGING.md` for detailed logging guide.  
**Android GPS**: See `docs/ANDROID_EMULATOR_LOCATION.md` for mock location setup.  
**Auth Problems**: Verify `VITE_CONVEX_SITE_URL` env var and `trustedOrigins` in `convex/auth.ts`.

For Capacitor-specific issues, run: `npx cap doctor`
