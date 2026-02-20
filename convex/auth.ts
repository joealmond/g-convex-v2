import { betterAuth } from 'better-auth/minimal'
import { createClient } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import { capacitor } from 'better-auth-capacitor'
import authConfig from './auth.config'
import { components } from './_generated/api'

import type { GenericCtx } from '@convex-dev/better-auth'
import type { DataModel } from './_generated/dataModel'

// =============================================================================
// Environment Variable Helpers
// =============================================================================

const REQUIRED_ENV_VARS = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] as const

/**
 * Check for missing env vars and log a helpful warning.
 * Returns placeholder values if missing to allow push to succeed.
 */
function getEnvConfig() {
  // CONVEX_SITE_URL is auto-set by Convex runtime to the HTTP actions endpoint
  // (e.g., https://fabulous-horse-363.eu-west-1.convex.site)
  // This MUST be used as baseURL — NOT SITE_URL from .env.local which is
  // typically http://localhost:3000 and breaks OAuth callbacks on mobile.
  const siteUrl = process.env.CONVEX_SITE_URL
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!siteUrl) {
    console.warn('⚠️  CONVEX_SITE_URL not set — this is auto-set by Convex runtime. OAuth will not work without it.')
  }

  const missing = REQUIRED_ENV_VARS.filter(name => !process.env[name])
  if (missing.length > 0) {
    console.warn(`⚠️  MISSING CONVEX ENV VARS: ${missing.join(', ')}. Set with: npx convex env set <VAR> "value" or use Convex Dashboard → Settings → Environment Variables`)
  }

  return {
    siteUrl: siteUrl || 'https://placeholder.convex.site',
    googleClientId: googleClientId || 'placeholder-client-id',
    googleClientSecret: googleClientSecret || 'placeholder-client-secret',
    isConfigured: !!siteUrl && missing.length === 0,
  }
}

// Get env config (warns if missing, uses placeholders to allow push)
const envConfig = getEnvConfig()

// Component client for Convex + Better Auth integration
export const authComponent = createClient<DataModel>(components.betterAuth, {})

// Create Better Auth instance with Convex adapter
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: envConfig.siteUrl,
    database: authComponent.adapter(ctx),
    // Trusted origins for CORS
    trustedOrigins: [
      'http://localhost:3000',
      'http://localhost:8787',
      // Capacitor WebView origins (iOS uses capacitor://, Android uses https://)
      'capacitor://localhost',
      'https://localhost',
      // Deep link scheme for OAuth callback on native
      'gmatrix://',
      envConfig.siteUrl,
      // Production Cloudflare Workers domain (set SITE_URL env var in Convex dashboard)
      ...(process.env.SITE_URL ? [process.env.SITE_URL] : []),
    ],
    // Google OAuth
    socialProviders: {
      google: {
        clientId: envConfig.googleClientId,
        clientSecret: envConfig.googleClientSecret,
      },
    },
    plugins: [
      // Required for Convex compatibility
      convex({ authConfig }),
      // Required for Capacitor native app OAuth (system browser + deep links)
      capacitor(),
    ],
  })
}

// NOTE: getCurrentUser was removed from this file to break a circular dependency.
// auth.ts → customFunctions.ts → authHelpers.ts → auth.ts caused "CA is not a function"
// during Convex push. If a getCurrentUser query is needed, define it in a separate
// file (e.g., convex/users.ts) that imports both publicQuery and authComponent.
