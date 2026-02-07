# Missing Features

Features that should be added to the `convex-tanstack-cloudflare` template to make it more production-ready.

> **Update (January 2026):** The template has been updated! Many of these features are now included. Items marked with ✅ are now in the template.

---

## ✅ 1. UI Component Library (shadcn/ui) - STILL MISSING

### Issue
The template provides no pre-built UI components. Everything must be built from scratch.

### Why It Matters
- Production apps need buttons, dialogs, forms, toasts, etc.
- Building these from scratch is time-consuming and error-prone
- shadcn/ui is the de facto standard for modern React apps

### Suggested Solution
Add shadcn/ui with common components:

```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog input toast form
```

**Files to add:**
- `components.json` - shadcn configuration
- `src/components/ui/` - UI component directory
- `src/lib/cn.ts` - cn() helper ✅ (now in template)

---

## ✅ 2. Testing Infrastructure - NOW INCLUDED

### Status: ✅ FIXED IN TEMPLATE

The template now includes:
- `vitest.config.ts` - Vitest configuration with happy-dom
- `npm run test` and `npm run test:watch` scripts
- `@testing-library/react` and `@testing-library/dom`
- `happy-dom` for fast DOM testing

### What Was Added
```json
{
  "scripts": {
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest --passWithNoTests"
  },
  "devDependencies": {
    "vitest": "^3.x.x",
    "@testing-library/react": "^16.x.x",
    "@testing-library/dom": "^10.x.x",
    "happy-dom": "^20.x.x"
  }
}
```

---

## 3. Form Handling - STILL SUGGESTED

### Issue
No form library integration for complex forms.

### Why It Matters
- Real apps have signup forms, product forms, settings forms
- Manual form handling is verbose and error-prone
- Validation feedback needs consistent patterns

### Suggested Solution
Add react-hook-form with Zod integration:

**package.json addition:**
```json
{
  "dependencies": {
    "react-hook-form": "^7.x.x",
    "@hookform/resolvers": "^3.x.x"
  }
}
```

**Example pattern to document:**
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export function LoginForm() {
  const form = useForm({
    resolver: zodResolver(schema)
  })
  // ...
}
```

---

## 4. Toast Notifications - STILL SUGGESTED

### Issue
Template mentions Sonner in docs but doesn't include it.

### Why It Matters
- Users need feedback for actions (save, delete, errors)
- Toast is standard UX pattern
- Easy to add but missing

### Suggested Solution
Add Sonner:

**package.json addition:**
```json
{
  "dependencies": {
    "sonner": "^2.x.x"
  }
}
```

**src/routes/__root.tsx addition:**
```tsx
import { Toaster } from 'sonner'

export function RootLayout() {
  return (
    <>
      {/* ... existing content */}
      <Toaster />
    </>
  )
}
```

---

## ✅ 5. Protected Routes Pattern - NOW INCLUDED

### Status: ✅ FIXED IN TEMPLATE

The template now includes:
- `src/routes/_authenticated.tsx` - Layout route with auth guard
- `src/routes/_authenticated/dashboard.tsx` - Example protected route
- Cookie-based auth check in `beforeLoad`

### What Was Added

**src/routes/_authenticated.tsx:**
```tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const isAuthenticated = typeof window !== 'undefined'
      && document.cookie.includes('better-auth')

    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}
```

**src/routes/_authenticated/dashboard.tsx:**
```tsx
export const Route = createFileRoute('/_authenticated/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  return <div>Protected content - only authenticated users see this</div>
}
```

---

## ✅ 6. Error and 404 Routes - NOW INCLUDED

### Status: ✅ FIXED IN TEMPLATE

The template now includes:
- `src/components/NotFound.tsx` - Styled 404 component
- `defaultNotFoundComponent` configured in router
- Home and Back navigation buttons

### What Was Added

**src/components/NotFound.tsx:**
```tsx
import { Link } from '@tanstack/react-router'
import { Home, ArrowLeft } from 'lucide-react'

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8 max-w-md">
        <h1 className="text-8xl font-bold text-primary/20">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="...">
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <button onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
```

**In router.tsx:**
```tsx
import { NotFound } from './components/NotFound'

const router = createRouter({
  // ...
  defaultNotFoundComponent: NotFound,
})
```

---

## 7. Charts/Visualization Library - STILL SUGGESTED

### Issue
No charting library for data visualization.

### Why It Matters
- Many apps need charts, graphs, dashboards
- Recharts is popular and easy to use
- Common requirement for business apps

### Suggested Solution
Add Recharts (optional in template docs):

```json
{
  "dependencies": {
    "recharts": "^3.x.x"
  }
}
```

Document usage in OPTIONAL_FEATURES.md.

---

## 8. Internationalization (i18n)

### Issue
No internationalization support.

### Why It Matters
- Global apps need multiple languages
- Adding i18n later is painful (refactoring all strings)
- Better to have pattern from start

### Suggested Solution
Document i18n pattern with simple approach:

**src/lib/i18n.ts:**
```typescript
import en from '@/locales/en.json'
import es from '@/locales/es.json'

const locales = { en, es }

export function useTranslation() {
  const locale = localStorage.getItem('locale') || 'en'
  return locales[locale as keyof typeof locales]
}
```

---

## 9. Database Seeding Script

### Issue
No way to populate database with test data.

### Why It Matters
- Development needs realistic data
- Testing needs reproducible data
- Onboarding new developers is easier with data

### Suggested Solution
Add seed script:

**convex/seed.ts:**
```typescript
import { mutation } from './_generated/server'

export const seedData = mutation({
  handler: async (ctx) => {
    // Insert sample messages
    await ctx.db.insert('messages', {
      content: 'Hello World!',
      authorId: 'system',
      authorName: 'System',
      createdAt: Date.now()
    })
    // ... more seed data
  }
})
```

**package.json:**
```json
{
  "scripts": {
    "seed": "npx convex run seed:seedData"
  }
}
```

---

## 10. Rate Limiting Component

### Issue
No rate limiting for API endpoints.

### Why It Matters
- Production APIs need protection from abuse
- Convex has official rate limiter component
- Should be demonstrated in template

### Suggested Solution
Add @convex-dev/rate-limiter:

```json
{
  "dependencies": {
    "@convex-dev/rate-limiter": "^0.3.x"
  }
}
```

Document usage in convex/README.md.

---

## Priority Matrix (Updated January 2026)

| Feature | Status | Notes |
|---------|--------|-------|
| shadcn/ui | ⚠️ Still Missing | Template has cn() but no components |
| Testing | ✅ **Fixed** | Vitest + happy-dom + testing-library |
| Toast Notifications | ⚠️ Suggested | Sonner easy to add |
| Protected Routes | ✅ **Fixed** | _authenticated layout pattern |
| Form Handling | ⚠️ Suggested | react-hook-form + zod |
| 404/Error Routes | ✅ **Fixed** | NotFound component |
| i18n | ⚠️ Suggested | Document pattern |
| Seed Script | ⚠️ Suggested | Useful for development |
| Rate Limiting | ⚠️ Suggested | @convex-dev/rate-limiter |
| Charts | ⚠️ Optional | Recharts |

---

*Last updated: January 2026*
*Based on template updates from our feedback*
