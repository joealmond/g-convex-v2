# Mobile Testing Notes — First Run (2025-02-10)

> Results from the first successful Capacitor build on iOS (iPhone) and Android (emulator).
> Both platforms loaded the app UI — the SPA shell architecture works!

## ✅ What Worked

- **App loads on both platforms** — SPA shell via TanStack Start SPA Mode works correctly
- **Navigation** — Bottom tab icons work (Home, Leaderboard, Map, Profile)
- **Dark/Light mode toggle** — Working on iOS
- **Language switcher** — Working on iOS (EN/HU)
- **Leaderboard page** — Renders correctly with content (see Android screenshot)
- **Android build** — Succeeded with 11 deprecation warnings (non-blocking)

## 🐛 Issues Found

### P0 — Critical (App Crashes / Broken Core)

#### 1. iOS Camera Crash — Missing `NSCameraUsageDescription`
**Platform**: iOS
**Error**: `This app has crashed because it attempted to access privacy-sensitive data without a usage description. The app's Info.plist must contain an NSCameraUsageDescription key with a string value explaining to the user how the app uses this data.`
**Fix**: Add privacy usage descriptions to `ios/App/App/Info.plist`:
- `NSCameraUsageDescription` — "G-Matrix needs camera access to take photos of products"
- `NSPhotoLibraryUsageDescription` — "G-Matrix needs photo library access to upload product images"
- `NSLocationWhenInUseUsageDescription` — "G-Matrix uses your location to find nearby stores" (if not already present)

#### 2. Sign In Not Working
**Platform**: Both
**Details**: Tapping "Sign In" button does not work. Likely Google OAuth redirect issue — OAuth callback URL won't work from `capacitor://localhost` or `https://localhost`. Needs investigation:
- Check if Google OAuth `redirect_uri` accepts Capacitor scheme origins
- May need to use a different auth flow for native (e.g., in-app browser, deep links)
- Check browser console/Xcode console for specific error messages

#### 3. Android Camera Not Working
**Platform**: Android
**Details**: Camera functionality does not work. Need to check:
- Android permissions in `AndroidManifest.xml` (`CAMERA`, `READ_EXTERNAL_STORAGE`)
- Capacitor Camera plugin configuration
- Whether the photo picker is the right approach vs. camera intent

### P1 — UX Issues (Usability Problems)

#### 4. Top Bar Smashed / Status Bar Overlap
**Platform**: Both (iOS + Android)
**Details**: The app's top navigation bar is overlapping with the device status bar (time, battery, signal icons). The app content starts at the very top of the screen without respecting the safe area.
**Fix**: Add safe area inset handling:
- Use `viewport-fit=cover` meta tag (already present)
- Add `padding-top: env(safe-area-inset-top)` to the TopBar component
- Use Capacitor's `SystemBars` plugin `insetsHandling: 'css'` config (already default in v8)
- Add `safe-area-inset-top` padding to the sticky header in TopBar component
- Consider using `env(safe-area-inset-top)` CSS variables

#### 5. Bottom Navigation Icons Hard to Touch
**Platform**: Both (more severe on Android)
**Details**: Bottom tab icons are difficult to tap. Need to either:
- Increase the touch target size (currently `h-16`, may need `h-18` or `h-20`)
- Add `padding-bottom: env(safe-area-inset-bottom)` for devices with home indicator
- Move icons slightly higher within the bar
- Increase icon size from `h-6 w-6` to `h-7 w-7`

#### 6. Location Icon Not Responding
**Platform**: iOS
**Details**: The location/GPS icon in the top bar does not respond to taps. Need to check:
- Whether `@capacitor/geolocation` is properly configured
- iOS location permissions in Info.plist
- Whether the `useGeolocation` hook handles native permission flow

### P2 — Behavior Issues

#### 7. Lock Orientation to Portrait Only
**Platform**: Both
**Details**: App is not designed for landscape orientation. When rotated horizontally, layout breaks significantly. Need to lock to portrait:
- **iOS**: In Xcode → Target → General → Deployment Info → uncheck Landscape Left and Landscape Right. Or set in `Info.plist`: `UISupportedInterfaceOrientations` = `UIInterfaceOrientationPortrait` only
- **Android**: In `AndroidManifest.xml`, add `android:screenOrientation="portrait"` to the `<activity>` tag

### P3 — Warnings (Non-blocking)

#### 8. iOS Warnings (Informational)
```
UIScene lifecycle will soon be required. Failure to adopt will result in an assert in the future.
Could not create a sandbox extension for '/var/containers/Bundle/Application/...'
Attempted to change to mode Portrait with an unsupported device (BackDual)...
```
- `UIScene` lifecycle: Capacitor should handle this in future updates. Not blocking.
- Sandbox extension: Normal simulator behavior, not an issue on real devices.
- BackDual camera: Simulator doesn't have a real camera, expected.

#### 9. Android Gradle Deprecation Warnings (11 warnings)
All are deprecation warnings from Capacitor v8 with AGP 9.x:
- `android.usesSdkInManifest.disallowed=false`
- `android.sdk.defaultTargetSdkToCompileSdkIfUnset=false`
- `android.enableAppCompileTimeRClass=false`
- `android.builtInKotlin=false`
- `android.newDsl=false`
- `android.r8.optimizedResourceShrinking=false`
- `android.defaults.buildfeatures.resvalues=true`
- `flatDir` usage warnings
- `excludeLibraryComponentsFromConstraints` recommendation

These are Capacitor v8 compat issues — will be resolved when upgrading to Capacitor v9. Not blocking.

## 📋 Priority Fix Order

1. **Safe area insets** (TopBar + BottomTabs) — Quick CSS fix, biggest visual improvement
2. **Lock to portrait orientation** — Simple native config change
3. **iOS Info.plist privacy descriptions** — Required for camera/location
4. **Android permissions** — Required for camera/location
5. **Sign In / OAuth flow** — Needs research for native auth flow
6. **Bottom nav touch targets** — UX improvement
7. **Camera functionality** — End-to-end testing after permissions are set

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
