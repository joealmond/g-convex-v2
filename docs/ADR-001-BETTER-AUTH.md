# ADR-001: Better Auth over Clerk

> Architecture Decision Record — Authentication provider choice

**Status:** Accepted  
**Date:** 2025-12  
**Decision maker:** Project lead

---

## Context

G-Matrix needs authentication for:
- User registration and login (Google OAuth)
- Session management across web (SSR) and native (Capacitor) platforms
- Integration with Convex backend for user identity in mutations/queries
- Admin role management

We evaluated **Clerk** and **Better Auth (via `@convex-dev/better-auth`)** as authentication providers.

## Decision

**We chose Better Auth** via the `@convex-dev/better-auth` Convex component.

## Rationale

### Why Better Auth

1. **Native Convex integration**: `@convex-dev/better-auth` runs auth logic directly inside Convex as a component. User sessions, tokens, and identity are stored in the Convex database — no external auth service to manage.

2. **No external dependency**: Clerk requires an external SaaS service (clerk.com). Better Auth is self-hosted within Convex, eliminating:
   - External service billing and quotas
   - Network latency for auth checks
   - Vendor lock-in concerns
   - GDPR compliance complexity (user data stays in one place)

3. **Capacitor compatibility**: Better Auth works with Capacitor's custom URL schemes (`capacitor://localhost` on iOS, `https://localhost` on Android) by configuring `trustedOrigins`. Clerk's session management had friction with non-standard origins.

4. **SSR + SPA dual mode**: Better Auth supports both:
   - Server-side token fetching (for SSR on Cloudflare Workers)
   - Client-side auth (for SPA mode in Capacitor)
   
   The `getAuth()` function in `__root.tsx` uses try/catch to gracefully handle both modes.

5. **Cost**: Better Auth is open-source with no per-user pricing. Clerk's free tier has limits (10k MAUs) that could become costly at scale.

6. **Simplicity**: Auth state lives in Convex alongside all other data. No separate dashboard, no webhook syncing, no user object mapping.

### Why Not Clerk

1. **External dependency**: Adds a third-party service dependency for a critical path
2. **Webhook complexity**: Requires webhook setup to sync Clerk users → Convex database
3. **Capacitor friction**: Clerk's session cookies don't work well with Capacitor's custom URL schemes without significant workarounds
4. **Cost at scale**: Per-user pricing adds ongoing operational cost
5. **Data locality**: User identity data split between Clerk and Convex

## Consequences

### Positive
- Single data store (Convex) for all app data including auth
- No external service dependency or billing
- Clean Capacitor integration
- Server-side and client-side auth both work

### Negative
- Less mature ecosystem compared to Clerk (fewer UI components, less documentation)
- No pre-built auth UI components (we build our own login page)
- Google OAuth requires manual OAuth app setup (Clerk handles this via their dashboard)
- Community support is smaller

### Risks
- `@convex-dev/better-auth` is relatively new — API may change
- Security patches depend on the Convex team and Better Auth maintainers
- We must handle auth UI ourselves (login page, session display, sign-out)

## Implementation

Key files:
- `convex/auth.ts` — Auth configuration, trusted origins, OAuth providers
- `convex/auth.config.ts` — Better Auth component configuration  
- `src/lib/auth-client.ts` — Client-side auth setup with platform-aware baseURL
- `src/routes/login.tsx` — Custom login page (Google OAuth button)
- `convex/http.ts` — HTTP routes for auth callbacks

## References

- [Better Auth docs](https://www.better-auth.com/)
- [`@convex-dev/better-auth` docs](https://labs.convex.dev/auth/setup)
- [Clerk docs](https://clerk.com/docs) (for comparison)
- Related: `docs/AUTH_SOLUTION.md` — detailed auth implementation notes
