# Push Notifications Implementation

This document describes the push notification features implemented in G-Matrix.

> **⚠️ Updated Feb 2026**: `onesignal-cordova-plugin` has been **removed** because it is
> incompatible with Capacitor 8's Swift Package Manager (SPM) — it has no `Package.swift`,
> causing iOS Xcode build failures (`Missing package product 'CapApp-SPM'`).
>
> **Current status**: Client-side push code is dormant (graceful no-op). Server-side delivery
> via OneSignal REST API (`convex/actions/sendPush.ts`) still works independently.
>
> **Recommended replacements**: `@capacitor-firebase/messaging` (SPM ✅, free),
> `@capacitor/push-notifications` (SPM ✅, manual token management), or wait for an
> SPM-compatible OneSignal Capacitor SDK.
>
> See `docs/PUSH_NOTIFICATIONS_SETUP.md` for migration options.

## Overview

Two notification features have been implemented:

1. **Streak Expiry Reminder**: Daily notification to users whose voting streak is about to expire
2. **New Product Nearby Alert**: Notification to nearby users when a new product is added with GPS location

## Architecture

### File Structure

```
convex/
├── actions/
│   ├── sendPush.ts           # OneSignal REST API delivery
│   ├── streakReminder.ts     # Streak expiry cron logic
│   └── nearbyProduct.ts      # Nearby product notification logic
├── notifications.ts          # DEPRECATED — device token management (OneSignal handles tokens)
├── profiles.ts               # Added: getActiveStreakers internal query
├── votes.ts                  # Added: getVotesWithGPS internal query + trigger
└── crons.ts                  # Added: streak reminder cron job

src/
├── lib/
│   └── onesignal.ts          # OneSignal SDK init, login/logout, permission
├── hooks/
│   └── use-push-notifications.ts  # React hook wiring OneSignal lifecycle
└── components/
    └── PushNotificationManager.tsx  # Auto-init component in root layout
```

## Feature 1: Streak Expiry Reminder

### How It Works

1. **Cron Schedule**: Runs daily at **8 PM UTC** (`convex/crons.ts`)
2. **Target Users**: Profiles with `streak >= 3` and `lastVoteDate` 22-24 hours ago
3. **Notification**: 
   - Title: `🔥 Your streak is about to expire!`
   - Body: `Don't lose your streak! Vote today to keep it alive.`
4. **Delivery**: Via FCM to all registered device tokens

### Implementation Details

**`convex/actions/streakReminder.ts`**:
- `checkStreakExpiry()` internalAction: 
  - Queries `getActiveStreakers` (profiles with streak >= 3)
  - Filters by `lastVoteDate` (23 hours ago ± 1 hour grace period)
  - Sends batch push notification via `sendPushToUsers`

**`convex/profiles.ts`**:
- `getActiveStreakers()` internalQuery: Returns profiles with streak >= 3 and lastVoteDate set

**`convex/crons.ts`**:
```typescript
crons.daily(
  "check-streak-expiry",
  { hourUTC: 20, minuteUTC: 0 },
  internal.actions.streakReminder.checkStreakExpiry,
);
```

### Configuration

- **Minimum Streak**: 3 days (only active streakers get reminders)
- **Reminder Window**: 22-24 hours after last vote
- **Frequency**: Once per day (8 PM UTC)

## Feature 2: New Product Nearby Alert

### How It Works

1. **Trigger**: When a product is created via `createProductAndVote` mutation with GPS coordinates
2. **Target Users**: Registered users who have voted with GPS within 10km radius
3. **Notification**:
   - Title: `📍 New product near you!`
   - Body: `{productName} was just added nearby. Be the first to rate it!`
4. **Exclusion**: Product creator is excluded from notifications

### Implementation Details

**`convex/actions/nearbyProduct.ts`**:
- `findNearbyUsers()` internalAction:
  - Queries `getVotesWithGPS` (all votes with GPS from registered users)
  - Calculates distance using Haversine formula
  - Returns unique user IDs within 10km radius
  - Excludes product creator

- `notifyNearbyProduct()` internalAction:
  - Called by `votes.createProductAndVote` mutation
  - Finds nearby users and sends batch notification

**`convex/votes.ts`**:
- `getVotesWithGPS()` internalQuery: Returns votes with latitude/longitude from registered users
- `createProductAndVote()` mutation: Added notification trigger when GPS coordinates provided:
  ```typescript
  if (args.latitude !== undefined && args.longitude !== undefined) {
    await ctx.scheduler.runAfter(0, internal.actions.nearbyProduct.notifyNearbyProduct, {
      productId: productId.toString(),
      productName: args.name,
      latitude: args.latitude,
      longitude: args.longitude,
      createdBy: userId,
    })
  }
  ```

### Configuration

- **Radius**: 10 km (configurable in `findNearbyUsers` action)
- **Distance Formula**: Haversine (accurate for Earth's curvature)
- **Trigger**: Only when product is created with GPS coordinates
- **User Filter**: Only registered users (can't send push to anonymous)

## FCM Integration (Required External Setup)

The notification logic is implemented, but **delivery requires FCM configuration**:

### Environment Variables

Set in Convex dashboard (`npx convex env set`):

```bash
FCM_SERVER_KEY=your_firebase_cloud_messaging_server_key
```

### Where to Get FCM_SERVER_KEY

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Project Settings** → **Cloud Messaging**
4. Copy the **Server Key** (under Cloud Messaging API Legacy)

### Note on Push Delivery

Push delivery uses the **OneSignal REST API**. OneSignal handles APNs (iOS) and FCM (Android) delivery internally. The Convex action simply targets users by `external_id` (Better Auth user ID), and OneSignal resolves the associated device tokens.

Environment variables required in Convex:
- `ONESIGNAL_APP_ID` — from OneSignal Dashboard → Settings → Keys & IDs
- `ONESIGNAL_REST_API_KEY` — from the same page

## Push Delivery Logic

### `convex/actions/sendPush.ts`

Two actions:

#### 1. `sendPushToUser(userId, title, body, data)`
- Sends a single notification via OneSignal REST API
- Targets user by `external_id` alias (set via `OneSignal.login()` on client)
- Returns `{ success, sent, failed, notificationId }`

#### 2. `sendPushToUsers(userIds[], title, body, data)`
- Batch delivery — sends a single OneSignal API call per chunk (50 users)
- OneSignal supports up to 2000 aliases per request
- Used by streak reminder and nearby product notifications

### OneSignal Payload Structure

```typescript
{
  app_id: "your-app-id",
  include_aliases: { external_id: ["user-id"] },
  target_channel: "push",
  headings: { en: title },
  contents: { en: body },
  data: { /* custom payload */ },
  ios_sound: "default",
  priority: 10,
}
        sound: 'default',
      },
    },
  },
}
```

## Testing

### Without FCM Setup

Logs will show:
```
[Push] FCM_SERVER_KEY not set, skipping push notification
```

Cron jobs will run but skip actual delivery. Check console logs:
```bash
npx convex logs --watch
```

### With FCM Setup

1. Set `FCM_SERVER_KEY` environment variable
2. Register device token via `usePushNotifications` hook
3. Wait for cron or create product with GPS
4. Check device for notification

### Manual Testing

**Streak Reminder**:
```bash
# Manually trigger the cron (admin only)
npx convex run internal.actions.streakReminder.checkStreakExpiry
```

**Nearby Product**:
1. Create a product with GPS via `/` (Add Product button)
2. Add GPS coordinates in the voting sheet
3. Check logs for nearby user count

## Internationalization

Notification strings use i18n keys:

**`src/locales/en.json`**:
```json
"push": {
  "streakReminder": "Your streak is about to expire! Vote to keep it going.",
  "newProductNearby": "New product added near you: {name}"
}
```

**`src/locales/hu.json`**:
```json
"push": {
  "streakReminder": "A sorozatod hamarosan lejár! Szavazz, hogy megtartsd.",
  "newProductNearby": "Új termék a közeledben: {name}"
}
```

**Note**: Push notifications are sent in English by default (backend doesn't know user language preference). Future enhancement: store user locale in profile and send localized notifications.

## Future Enhancements

1. **User Preferences**: 
   - Allow users to opt-out of specific notification types
   - Store in `profiles` table (e.g., `notificationPreferences` field)

2. **Localized Notifications**:
   - Store user locale in profile
   - Send notifications in user's language

3. **Notification History**:
   - Track sent notifications in a `notificationLog` table
   - Show in-app notification center

4. **FCM Topics**:
   - Subscribe users to topics (e.g., "new-products-nearby")
   - Reduces individual token processing

5. **Scheduling**:
   - Allow users to set "quiet hours" for notifications
   - Delay delivery until preferred time

6. **Rich Notifications**:
   - Add product images to notifications
   - Deep link to specific product pages

7. **A/B Testing**:
   - Test different notification copy
   - Optimize engagement rates

## Troubleshooting

### No notifications received

**Check 1**: FCM_SERVER_KEY set?
```bash
npx convex env ls
```

**Check 2**: Device token registered?
```bash
npx convex data query api.notifications.getTokensByUser '{"userId":"YOUR_USER_ID"}'
```

**Check 3**: Cron running?
```bash
npx convex logs --watch
# Look for "[Streak Reminder]" or "[Nearby Product]" logs
```

**Check 4**: User eligible?
- Streak reminder: User must have streak >= 3 and lastVoteDate 22-24h ago
- Nearby product: User must have voted with GPS within 10km

### FCM errors

**Invalid token**: Token expired or app uninstalled
- Solution: Remove stale tokens periodically (implement cleanup cron)

**Authentication error**: FCM_SERVER_KEY invalid
- Solution: Regenerate server key in Firebase Console

**Rate limit**: Too many requests
- Solution: Implement exponential backoff or use FCM batch API

## Security Considerations

1. **Token Storage**: Device tokens are stored in Convex `deviceTokens` table
   - Only accessible via internal queries (not public)
   - Tokens are platform-specific (iOS/Android/Web)

2. **User Privacy**: 
   - GPS coordinates from votes are used to find nearby users
   - Product creator is excluded from notifications
   - Anonymous users cannot receive push notifications

3. **Rate Limiting**:
   - Streak reminder runs once per day (low volume)
   - Nearby product notifications only trigger on new product creation (also low volume)
   - FCM has built-in rate limiting (500 requests/sec per project)

4. **Data Payload**:
   - Avoid sending sensitive data in notification payload
   - Use deep links to fetch fresh data on notification tap

## Monitoring

Recommended CloudWatch or similar monitoring:

1. **Notification Delivery Rate**: % of successful sends
2. **Cron Execution Time**: How long streak check takes
3. **Error Rate**: FCM errors per 1000 sends
4. **User Engagement**: Click-through rate on notifications

Logs available via:
```bash
npx convex logs --watch
```

Look for:
- `[Push]` prefix for FCM delivery logs
- `[Streak Reminder]` for cron execution
- `[Nearby Product]` for product notification triggers

---

*Last updated: 2026-02-16*
