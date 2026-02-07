# Template Improvements Documentation

## Purpose

This directory contains documentation of **issues, gaps, and improvement opportunities** discovered while building the G-Matrix application using the `convex-tanstack-cloudflare` template.

These findings are intended to be contributed back to the original template to improve it for future users.

---

## Original Template

**Repository**: `/Users/mandulaj/dev/source/convex-tanstack-cloudflare`

**Description**: A production-ready template combining:
- TanStack Start (React SSR with file-based routing)
- Convex (real-time database and serverless backend)
- Cloudflare Workers (edge deployment)
- Better Auth (self-hosted authentication)

---

## Documentation Structure

### 📋 Template Feedback (Contribute Back)
| File | Description |
|------|-------------|
| [MISSING_FEATURES.md](./MISSING_FEATURES.md) | Features missing from the template that are commonly needed |
| [DOCUMENTATION_GAPS.md](./DOCUMENTATION_GAPS.md) | Documentation that should be added or improved |
| [PATTERN_IMPROVEMENTS.md](./PATTERN_IMPROVEMENTS.md) | Better patterns and practices discovered |
| [TEMPLATE_IMPROVEMENTS.md](./TEMPLATE_IMPROVEMENTS.md) | **Critical** API patterns and fixes (TanStack Start v1.154+) |

### 🔧 Project-Specific Docs
| File | Description |
|------|-------------|
| [AI_AGENT_CONTEXT.md](./AI_AGENT_CONTEXT.md) | Comprehensive context for AI coding agents (stack, structure, patterns) |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Complete deployment guide for Cloudflare Workers |

---

## Quick Summary of Findings

### ✅ Fixed in Template (Already Implemented)
The template has been updated based on our feedback:
1. **TanStack Start v1.154+** - Correct `start.tsx` (no manual hydration)
2. **Server entry** - Correct `server.ts` pattern
3. **Cloudflare plugin** - No config callback needed
4. **Route tree generation** - `generate:routes` script added
5. **NotFound component** - Proper 404 page with navigation
6. **Vitest setup** - Testing infrastructure with happy-dom
7. **_authenticated layout** - Protected route pattern

### ✅ Implemented in g-convex-v2
Based on template updates, we now have:
1. **Environment helpers** in `convex/auth.ts` - Warns about missing env vars
2. **Vitest config** - `npm run test` and `npm run test:watch`
3. **NotFound component** - Styled 404 with Home/Back buttons
4. **_authenticated layout** - Route-level auth guard
5. **Example dashboard** - `/dashboard` protected route
6. **Testing deps** - vitest, happy-dom, @testing-library/*

### 🟡 Remaining Gaps (MISSING_FEATURES.md)
1. **No UI Component Library** - Template lacks shadcn/ui (we added it)
2. **Limited Routes** - Only 2 example routes (we added more)
3. **No Form Handling** - No react-hook-form (we added it)

### 🟢 Documentation Improvements Made
1. Typo in repo name fixed ("cloudfare" vs "cloudflare")
2. This feedback documentation created
3. AI agent context documented

---

## Recommended Template Changes

### ✅ Already Fixed in Template
The template was updated based on our feedback. These are now correct:

1. **`src/start.tsx`** - No manual hydration, just export startInstance:
   ```tsx
   export const startInstance = undefined
   ```

2. **`src/server.ts`** - Correct handler pattern:
   ```typescript
   import handler from '@tanstack/react-start/server-entry'

   export default {
     fetch(request: Request) {
       return handler.fetch(request)
     },
   }
   ```

3. **`vite.config.ts`** - Simple cloudflare config (no callback):
   ```typescript
   cloudflare({
     viteEnvironment: { name: 'ssr' },
     configPath: './wrangler.jsonc',
   })
   ```

4. **Testing infrastructure** - Vitest + happy-dom configured

5. **Protected routes** - `_authenticated` layout pattern

### Still Worth Adding to Template
```json
{
  "dependencies": {
    "sonner": "^2.x.x",           // Toast notifications
    "react-hook-form": "^7.x.x",  // Form handling
    "@hookform/resolvers": "^5.x.x"
  }
}
```

---

## How to Contribute Findings

When you discover an issue or improvement opportunity:

1. **Identify the category** (missing feature, documentation gap, pattern improvement, critical fix)
2. **Add to the appropriate file** with:
   - Clear description of the issue
   - Why it matters
   - Suggested solution
   - Code examples if applicable
3. **Update this README** summary if it's a significant finding
4. **For critical issues** - Add to TEMPLATE_IMPROVEMENTS.md with ✅/❌ examples

---

## Document Status

| Document | Status | Notes |
|----------|--------|-------|
| README.md | ✅ Updated | This file - reflects template updates |
| TEMPLATE_IMPROVEMENTS.md | ✅ Updated | SSR fixes, hydration patterns, env helpers |
| MISSING_FEATURES.md | ⚠️ Partially Outdated | Template now has testing, protected routes |
| DOCUMENTATION_GAPS.md | ✅ Complete | Template improvements made |
| PATTERN_IMPROVEMENTS.md | ✅ Complete | Best practices documented |
| AI_AGENT_CONTEXT.md | ✅ Complete | AI coding context |
| DEPLOYMENT.md | ✅ Complete | Cloudflare deployment guide |

---

*Last updated: January 2026*
*Template version: Updated based on our feedback*
