# Push Notifications Setup Guide (OneSignal)

> **⚠️ STATUS (Feb 2026)**: `onesignal-cordova-plugin` has been **removed** from the project.
> It is a Cordova-era plugin with no Swift Package Manager (SPM) support, which causes
> Capacitor 8 iOS builds to fail (`Missing package product 'CapApp-SPM'`).
>
> The client-side push code is dormant (all functions gracefully no-op).
> Server-side delivery via OneSignal REST API still works independently.
>
> **Upstream issue**: [OneSignal/OneSignal-Cordova-SDK#1069](https://github.com/OneSignal/OneSignal-Cordova-SDK/issues/1069) — assigned but no ETA (Flutter SDK prioritized first).
>
> **To re-enable push notifications**, choose one of these SPM-compatible alternatives:
>
> | Option | Package | SPM | Effort | Notes |
> |--------|---------|-----|--------|-------|
> | **Firebase Cloud Messaging** | `@capacitor-firebase/messaging` | ✅ | Medium | Best free option, full SPM support, rich analytics |
> | **Capacitor Push** | `@capacitor/push-notifications` | ✅ | High | Official Capacitor plugin, requires manual APNs/FCM token management |
> | **OneSignal (future)** | TBD | ❌ | Low | Re-add when OneSignal releases an SPM-compatible SDK |
>
> **Workarounds to keep OneSignal** (from issue #1069):
>
> | Workaround | How | Trade-offs |
> |-----------|-----|------------|
> | **CocoaPods fallback** | `npx cap add ios --packagemanager CocoaPods` | Loses native customizations in `ios/`; CocoaPods entering maintenance mode |
> | **Community SPM plugin** | [AppPresser-Apps/capacitor-onesignal](https://github.com/AppPresser-Apps/capacitor-onesignal) | Third-party, less battle-tested |
> | **Manual Xcode SPM** | Add `https://github.com/OneSignal/OneSignal-iOS-SDK.git` via File → Add Packages | Bypasses Cordova plugin; requires manual bridge code |

Push notifications were previously delivered via [OneSignal](https://onesignal.com/). The architecture below describes the original setup for reference.

## Architecture Overview (Original — OneSignal)

```
┌─────────────────────────────────┐
│  Mobile App (Capacitor)         │
│  onesignal-cordova-plugin       │  ← REMOVED (no SPM support)
│  ┌───────────────────────────┐  │
│  │ OneSignal.initialize(ID)  │  │  ← App startup
│  │ OneSignal.login(userId)   │  │  ← After auth
│  │ OneSignal.Notifications   │  │  ← Permission & listeners
│  └───────────────────────────┘  │
└───────────┬─────────────────────┘
            │ Device registers itself
            ▼
┌─────────────────────────────────┐
│  OneSignal Dashboard            │
│  Manages tokens, segments,      │
│  delivery, analytics            │
└───────────┬─────────────────────┘
            ▲ REST API
            │ POST /notifications
┌───────────┴─────────────────────┐
│  Convex Actions                 │
│  convex/actions/sendPush.ts     │  ← Still functional
│  Targets users by external_id   │
└─────────────────────────────────┘
```

## What's Implemented (Code)

| Component | Location | Purpose |
|-----------|----------|---------|
| OneSignal SDK init | `src/lib/onesignal.ts` | Initialize, login/logout, permission |
| Push hook | `src/hooks/use-push-notifications.ts` | React hook wiring OneSignal lifecycle |
| Push manager | `src/components/PushNotificationManager.tsx` | Auto-init in root layout |
| Push delivery | `convex/actions/sendPush.ts` | OneSignal REST API from Convex |
| Streak reminder | `convex/actions/streakReminder.ts` | Daily cron → push expiring streaks |
| Nearby product | `convex/actions/nearbyProduct.ts` | Push to nearby users on new product |
| Cron schedule | `convex/crons.ts` | Triggers streak reminder daily |

## Setup Steps

### 1. Create a OneSignal App

1. Go to [OneSignal Dashboard](https://dashboard.onesignal.com/) → **New App/Website**
2. Enter app name (e.g., "G-Matrix")
3. Select platform: **Google Android (FCM)** and/or **Apple iOS (APNs)**

### 2. Configure Android (FCM)

1. In OneSignal dashboard → **Settings → Platforms → Google Android**
2. You need a **Firebase Server Key** (FCM v1):
   - Go to [Firebase Console](https://console.firebase.google.com/) → Project Settings → Cloud Messaging
   - Copy the **Server key** (or create a service account JSON for FCM v1)
   - Paste into OneSignal dashboard
3. Download `google-services.json` from Firebase Console → place in `android/app/`
4. Ensure these are in `android/app/build.gradle`:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```

### 3. Configure iOS (APNs)

1. In OneSignal dashboard → **Settings → Platforms → Apple iOS**
2. Upload your **APNs Authentication Key** (.p8 file):
   - Go to [Apple Developer Portal](https://developer.apple.com/) → Keys → Create key with "Apple Push Notifications service (APNs)"
   - Download the `.p8` file
   - Enter Key ID, Team ID, and Bundle ID (`com.gmatrix.app`)
3. In Xcode, enable Push Notifications capability:
   - Open `ios/App/App.xcodeproj`
   - Target → Signing & Capabilities → "+ Capability" → **Push Notifications**
   - Also add **Background Modes** → check "Remote notifications"

### 4. Set Environment Variables

#### Client-side (Vite)

Add to `.env` (or `.env.local`):
```bash
# OneSignal App ID (from Dashboard → Settings → Keys & IDs)
VITE_ONESIGNAL_APP_ID=your-onesignal-app-id-here
```

#### Server-side (Convex)

Set via `npx convex env set`:
```bash
npx convex env set ONESIGNAL_APP_ID "your-onesignal-app-id-here"
npx convex env set ONESIGNAL_REST_API_KEY "your-rest-api-key-here"
```

> **Where to find these**: OneSignal Dashboard → Settings → Keys & IDs
> - **App ID**: The UUID shown at the top
> - **REST API Key**: Under "REST API Key"

### 5. Sync Native Projects

After configuration:
```bash
npx cap sync
```

This copies the OneSignal Cordova plugin to both iOS and Android native projects.

### 6. Native Build Notes

#### Android
- OneSignal auto-configures via `google-services.json` — no additional Gradle changes needed beyond what `cap sync` provides.
- The `onesignal-cordova-plugin` Cordova hook handles manifest permissions.

#### iOS
- After `cap sync`, open Xcode and verify the Push Notifications entitlement is present.
- OneSignal requires **real device** testing — push does not work on iOS Simulator.

## How It Works

### Client-side Flow
1. `PushNotificationManager` (in root layout, inside `<ClientOnly>`) calls `initOneSignal()` on mount
2. `initOneSignal()` calls `OneSignal.initialize(appId)` — SDK registers device with OneSignal servers
3. When user authenticates, `oneSignalLogin(userId)` links device to the user's `external_id`
4. On sign-out, `oneSignalLogout()` dissociates the device from the user
5. Notification permission is requested via `requestPushPermission()` — can be triggered from settings UI

### Server-side Flow
1. Convex cron triggers `streakReminder` or `nearbyProduct` action
2. Action identifies target user IDs
3. Calls `sendPushToUser` / `sendPushToUsers` which POST to OneSignal REST API
4. OneSignal resolves `external_id` → device tokens → delivers push via APNs/FCM

### Key Concept: external_id
OneSignal uses `external_id` to link a device to your app's user. This is set by `OneSignal.login(userId)` on the client. Server-side, we target users with:
```json
{
  "include_aliases": { "external_id": ["user-id-here"] },
  "target_channel": "push"
}
```
No manual token storage needed — OneSignal maps external_id to device tokens automatically.

## Testing

1. **Physical devices only** — push notifications don't work on emulators/simulators
2. Use OneSignal dashboard → **Messages → Push → New Push** to send a test
3. Or target a specific user:
   ```bash
   curl -X POST https://api.onesignal.com/notifications \
     -H "Authorization: Key YOUR_REST_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "app_id": "YOUR_APP_ID",
       "include_aliases": { "external_id": ["test-user-id"] },
       "target_channel": "push",
       "headings": { "en": "Test" },
       "contents": { "en": "Hello from OneSignal!" }
     }'
   ```
4. Check Convex dashboard logs for `[Push]` prefixed messages

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `VITE_ONESIGNAL_APP_ID not set` in console | Add to `.env` and restart dev server |
| `OneSignal not configured` in Convex logs | Run `npx convex env set ONESIGNAL_APP_ID ...` and `ONESIGNAL_REST_API_KEY ...` |
| No notifications on iOS | Verify APNs key uploaded, Push capability enabled in Xcode, test on real device |
| No notifications on Android | Verify `google-services.json` in `android/app/`, FCM key set in OneSignal dashboard |
| User not receiving targeted push | Verify `OneSignal.login(userId)` is called after auth — check console for `[OneSignal] Logged in user:` |

## Migration Notes

### From FCM direct → OneSignal (historical)
- `@capacitor/push-notifications` (removed) — replaced by `onesignal-cordova-plugin`
- `convex/notifications.ts` (deprecated) — token CRUD, no longer needed
- `deviceTokens` table (deprecated) — kept in schema for backward compat
- `FCM_SERVER_KEY` env var (removed) — replaced by `ONESIGNAL_REST_API_KEY`

### From OneSignal → TBD (current, Feb 2026)
- `onesignal-cordova-plugin` (removed) — incompatible with Capacitor 8 SPM
- `src/lib/onesignal.ts` — code preserved but dormant (dynamic import fails gracefully)
- `src/hooks/use-push-notifications.ts` — hook preserved, no-ops without SDK
- `src/components/PushNotificationManager.tsx` — component preserved, no-ops without SDK
- `convex/actions/sendPush.ts` — **still functional** via OneSignal REST API

**When re-adding push**, the recommended migration path is:
1. Install `@capacitor-firebase/messaging` (SPM-compatible, free tier)
2. Replace `src/lib/onesignal.ts` with Firebase messaging init + token registration
3. Replace `convex/actions/sendPush.ts` with FCM HTTP v1 API calls
4. Store device tokens in Convex (re-enable `convex/notifications.ts` or similar)
5. Run `npx cap sync` — Firebase plugin has proper `Package.swift`

References:
- [OneSignal Cordova/Capacitor SDK](https://github.com/OneSignal/OneSignal-Cordova-SDK) (no SPM yet)
- [OneSignal REST API — Create Notification](https://documentation.onesignal.com/reference/create-notification)
- [@capacitor-firebase/messaging](https://github.com/nicefiction/capacitor-firebase/tree/main/packages/messaging) (recommended replacement)
- [@capacitor/push-notifications](https://capacitorjs.com/docs/apis/push-notifications) (official Capacitor plugin)
- [Firebase Cloud Messaging REST API](https://firebase.google.com/docs/cloud-messaging/send-message)
