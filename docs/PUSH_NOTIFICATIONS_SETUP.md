# Push Notifications Setup Guide (OneSignal)

Push notifications are delivered via [OneSignal](https://onesignal.com/). The client-side SDK handles device registration automatically. Server-side delivery uses the OneSignal REST API from Convex actions.

## Architecture Overview

```
┌─────────────────────────────────┐
│  Mobile App (Capacitor)         │
│  onesignal-cordova-plugin       │
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
│  convex/actions/sendPush.ts     │
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

## Migration Notes (from FCM direct)

The previous implementation used:
- `@capacitor/push-notifications` (removed) — replaced by `onesignal-cordova-plugin`
- `convex/notifications.ts` (deprecated) — token CRUD, no longer needed
- `deviceTokens` table (deprecated) — kept in schema for backward compat
- `FCM_SERVER_KEY` env var (removed) — replaced by `ONESIGNAL_REST_API_KEY`

References:
- [OneSignal Cordova/Capacitor SDK](https://github.com/nicefiction/onesignal-cordova-plugin)
- [OneSignal REST API — Create Notification](https://documentation.onesignal.com/reference/create-notification)
- [OneSignal Mobile SDK Reference](https://documentation.onesignal.com/docs/mobile-sdk-reference)
