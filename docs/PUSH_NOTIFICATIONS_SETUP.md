# Push Notifications Setup Guide

Push notification infrastructure is scaffolded in code but requires external service configuration to deliver messages.

## What's Already Done (Code)

| Component | Status | Location |
|-----------|--------|----------|
| `deviceTokens` table | ✅ | `convex/schema.ts` |
| Token register/remove mutations | ✅ | `convex/notifications.ts` |
| `usePushNotifications` hook | ✅ | `src/hooks/use-push-notifications.ts` |
| `@capacitor/push-notifications` | ✅ | Installed in `package.json` |
| i18n keys (push.*) | ✅ | `src/locales/en.json`, `hu.json` |

## What You Need to Configure

### 1. Firebase Cloud Messaging (Android)

1. Go to [Firebase Console](https://console.firebase.google.com/) and create/select a project
2. Add an Android app with package name `com.gmatrix.app` (from `capacitor.config.ts`)
3. Download `google-services.json` and place it in `android/app/`
4. Add Firebase dependencies to `android/app/build.gradle`:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```
5. Add to `android/build.gradle`:
   ```gradle
   classpath 'com.google.gms:google-services:4.4.2'
   ```

### 2. Apple Push Notification service (iOS)

1. Go to [Apple Developer Portal](https://developer.apple.com/) → Certificates, Identifiers & Profiles
2. Create an APNs Key (or certificate) for your App ID
3. Enable "Push Notifications" capability in Xcode:
   - Open `ios/App/App.xcodeproj`
   - Select the App target → Signing & Capabilities
   - Click "+ Capability" → Push Notifications
4. Upload the APNs key to Firebase (if using FCM as unified provider) or configure directly

### 3. Server-Side Push Delivery

To actually **send** push notifications, you need a Convex action that calls FCM/APNs:

```typescript
// convex/actions/sendPush.ts (example)
import { action } from '../_generated/server'
import { v } from 'convex/values'

export const sendPush = action({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, { userId, title, body, data }) => {
    // 1. Fetch user's device tokens
    const tokens = await ctx.runQuery(api.notifications.getTokensByUser, { userId })
    
    // 2. Send via FCM HTTP v1 API
    for (const { token, platform } of tokens) {
      await fetch('https://fcm.googleapis.com/v1/projects/YOUR_PROJECT/messages:send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`, // OAuth2 service account
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            data: data ?? {},
          },
        }),
      })
    }
  },
})
```

### 4. Cron Triggers (Optional)

The app has a cron system in `convex/crons.ts`. Add triggers for:

- **Streak expiry reminder**: Check profiles where `lastVoteDate` is approaching 24h, send push
- **New product near you**: When a product is created, find users with recent GPS votes nearby

### 5. Wire Hook into App

In the root layout or profile page, call the hook:

```tsx
import { usePushNotifications } from '@/hooks/use-push-notifications'

function App() {
  const user = useCurrentUser() // your auth hook
  const { requestPermission } = usePushNotifications(user?._id)
  
  // Call requestPermission() from a settings toggle or first-launch prompt
}
```

## Testing

1. **Android**: Run on physical device (emulator has limited FCM support)
2. **iOS**: Run on physical device (simulator doesn't support push)
3. Use Firebase Console → Cloud Messaging → "Send test message" with a device token
4. Check Convex dashboard for `deviceTokens` table entries
