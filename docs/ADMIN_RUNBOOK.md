# Admin Setup Runbook

> How to make a user an admin in G-Matrix.

---

## Method 1: Email Whitelist (Recommended for first admin)

1. Edit `convex/lib/config.ts`
2. Add your email to the `ADMIN_EMAILS` array:

```ts
export const ADMIN_EMAILS: string[] = [
  "your-email@gmail.com",
]
```

3. Deploy: `npx convex deploy` (production) or let `npx convex dev` sync (development)
4. Sign in with that email — you're automatically an admin

## Method 2: Convex Dashboard (For existing users)

1. Go to your [Convex Dashboard](https://dashboard.convex.dev/)
2. Select your project → **Functions** tab
3. Find and run `users.setAdminByEmail`:

```json
{
  "email": "user@example.com",
  "isAdmin": true
}
```

4. The user will have admin access on their next page load

## Method 3: Direct Database Edit

1. Go to Convex Dashboard → **Data** tab
2. Find the `profiles` table
3. Locate the user's profile by `userId`
4. Set the `role` field to `"admin"`

## Verifying Admin Status

Once admin, the user will see:
- **Admin toolbar** at the top of every page
- **Delete buttons** on product cards
- **Reports management** in the admin page (`/admin`)
- **Settings panel** for time-decay, crons, etc.

## Revoking Admin

### Via Dashboard
Run `users.setAdminByEmail`:
```json
{
  "email": "user@example.com",
  "isAdmin": false
}
```

### Via Database
Set the `role` field on the user's profile to `"user"` or remove it.

### Via Email Whitelist
Remove the email from `ADMIN_EMAILS` in `convex/lib/config.ts` and redeploy. Note: this only prevents future auto-promotion — existing admin status is stored in the profile.

## Admin Capabilities

| Feature | Location |
|---|---|
| Delete any product | Product cards, product detail page |
| View & manage reports | `/admin` page |
| Manage time-decay settings | `/admin` → Settings |
| View all user profiles | `/admin` page |
| Award points to users | Admin API |
| Reset user streaks | Admin API |
| Impersonate users | Admin toolbar (dev only) |

## Security Notes

- Admin checks use `requireAdmin(ctx)` from `convex/lib/authHelpers.ts`
- All admin mutations verify the caller's role server-side
- The admin toolbar and UI elements are hidden for non-admins but the real security boundary is in the backend mutations
- Rate limiting applies to admins too (except for admin-specific endpoints)
