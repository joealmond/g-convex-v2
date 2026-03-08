# Public Release Checklist

This checklist is the minimum release gate for shipping G-Matrix to the public across web, iOS, and Android.

## 1. Engineering Baseline

- [ ] `npm run release:check:preview` passes before preview deploys
- [ ] `npm run release:check:prod` passes before production deploys
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build:preview` passes
- [ ] CI is green in [.github/workflows/ci.yml](../.github/workflows/ci.yml)
- [ ] No known P0 or P1 bugs in auth, voting, camera, offline sync, or product creation

## 2. Product Safety Boundaries

- [ ] Frontend and backend score logic still match in [src/lib/score-utils.ts](../src/lib/score-utils.ts) and [convex/lib/scoreUtils.ts](../convex/lib/scoreUtils.ts)
- [ ] Allergen IDs remain aligned with [src/lib/app-config.ts](../src/lib/app-config.ts)
- [ ] Native auth flow still works through [convex/http.ts](../convex/http.ts) and [src/lib/auth-client.ts](../src/lib/auth-client.ts)
- [ ] Camera open, capture, cancel, and close all work on real iOS and Android devices

## 3. Production Configuration

- [ ] Production Convex deployment is configured
- [ ] `VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL` are set for production
- [ ] Google OAuth production redirect URIs are configured
- [ ] `trustedOrigins` in [convex/auth.ts](../convex/auth.ts) includes the production web domain and native origins
- [ ] R2 bucket, credentials, and public URL are configured
- [ ] `VITE_SENTRY_DSN` is set for production if Sentry is enabled
- [ ] Cloudflare deploy secrets are configured for preview and production

Required GitHub Actions secrets for the default Cloudflare + Convex Cloud path:
- Preview: `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CONVEX_DEPLOY_KEY`
- Production: `VITE_CONVEX_URL_PROD`, `VITE_CONVEX_SITE_URL_PROD`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CONVEX_DEPLOY_KEY`

Optional secrets depending on deployment setup:
- `VITE_SENTRY_DSN` for production error reporting
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` when `DEPLOY_TARGET=vercel`
- `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` when `DEPLOY_TARGET=netlify`
- `CONVEX_URL`, `CONVEX_ADMIN_KEY`, `CONVEX_URL_PROD`, `CONVEX_ADMIN_KEY_PROD` when `CONVEX_HOSTING=self-hosted`

How to get the default missing preview secrets:
- `CLOUDFLARE_API_TOKEN`: Create a token at https://dash.cloudflare.com/profile/api-tokens. For this repo's Worker deploy path, grant at least `Account: Workers Scripts:Edit` and `Account: Account Settings:Read`. Add `Zone: DNS:Edit` only if you also manage a custom domain through Cloudflare.
- `CLOUDFLARE_ACCOUNT_ID`: Open the Cloudflare dashboard and copy the Account ID from the account overview/sidebar.
- `CONVEX_DEPLOY_KEY`: In the Convex dashboard for this project, open Settings → Deploy Keys and create or copy a deploy key.

Local verification flow before pushing secrets to GitHub:
```bash
export CLOUDFLARE_API_TOKEN="..."
export CLOUDFLARE_ACCOUNT_ID="..."
export CONVEX_DEPLOY_KEY="..."
npm run release:check:preview -- --env-only
npm run release:check:preview
```

GitHub Actions setup:
- Repository Settings → Secrets and variables → Actions → New repository secret
- Add the same values under the exact names used above
- Re-run the Deploy workflow or push to the deployment branch again

## 4. Compliance And Store Requirements

- [ ] Privacy policy is published and linked from the app/store listing
- [ ] Terms of service are published
- [ ] Support URL and contact email are ready for store submission
- [ ] App icons and screenshots are prepared for web, App Store, and Play Store
- [ ] Sign in with Apple requirement has been checked if Google sign-in remains in iOS builds
- [ ] Push-notification scope is explicit: enabled and tested, or deferred and removed from launch expectations

## 5. Manual QA Gate

- [ ] Run [docs/QA_TEST_PLAN.md](./QA_TEST_PLAN.md) on staging or preview
- [ ] Test at 320px width on web and on a small iPhone
- [ ] Test on at least one modern iPhone and one Android device
- [ ] Verify login, voting, comments, community feed, and product detail flow
- [ ] Verify offline vote queueing and reconnect sync
- [ ] Verify barcode lookup, AI analysis, image upload, and GPS tagging
- [ ] Verify admin-only actions are still protected server-side

## 6. Launch Day

- [ ] Deploy Convex backend first
- [ ] Deploy web frontend and verify production health manually
- [ ] Run smoke tests against production
- [ ] Release TestFlight and Play Store builds only after smoke tests pass
- [ ] Watch Sentry, Convex logs, and user reports for the first 24 hours

## 7. Post-Launch Stabilization

- [ ] Review errors daily during the first release week
- [ ] Triage sync failures, auth failures, and camera issues first
- [ ] Keep a rollback plan ready for web deploys and mobile hotfixes
- [ ] Convert newly discovered launch issues into tests where possible
