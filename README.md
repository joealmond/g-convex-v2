# G-Matrix - Gluten-Free Product Rating System

A community-driven platform for rating gluten-free products on safety and taste. Built with Convex, TanStack Start, and Cloudflare Workers.

## 🌾 About G-Matrix

G-Matrix helps the celiac community make informed decisions about gluten-free products by visualizing them on a 2D matrix:
- **Safety (Y-axis)**: How safe is it for celiacs? (0-100)
- **Taste (X-axis)**: How good does it taste? (0-100)

Products are categorized into four quadrants:
- 🏆 **Holy Grail**: Safe AND tasty (top-right)
- 🥫 **Survivor Food**: Safe but not tasty (top-left)
- 🎲 **Russian Roulette**: Tasty but risky (bottom-right)
- 🗑️ **The Bin**: Avoid at all costs (bottom-left)

## ✨ Features

### Core Functionality
- **Interactive Matrix Visualization**: Scatter plot with quadrant-based coloring using Recharts
- **Product Rating**: Vote on products with quick presets or fine-tune sliders
- **Anonymous & Registered Voting**: Vote without account (1x weight) or sign in for 2x weight
- **Product Management**: Add, edit, and delete products (admin only)
- **Store Tagging**: Tag where you bought products with optional GPS location
- **Product Detail Pages**: Full product info, voting history, and recent votes

### Gamification
- **Points System**: Earn points for voting, adding products, and maintaining streaks
- **Badges**: Unlock 7 achievement badges (First Scout, Trailblazer, Century Scout, etc.)
- **Leaderboard**: Compete with community for top contributor status
- **Streak Tracking**: Maintain daily voting streaks for bonus points
- **Profile Page**: View your stats, voting history, and earned badges

### Internationalization
- **Multi-language Support**: English and Hungarian (Magyar) translations
- **Language Switcher**: Toggle between languages with flag icons

### Admin Features
- **Admin Dashboard**: Manage all products with search, edit, and delete
- **Product CRUD**: Full create, read, update, delete operations
- **Analytics**: View total products, votes, and average votes per product
- **Role-Based Access**: Admin-only routes protected by RBAC

## 🚀 Tech Stack

| Layer         | Technology         | Purpose                                       |
| ------------- | ------------------ | --------------------------------------------- |
| **Framework** | TanStack Start     | Modern React SSR with file-based routing      |
| **Database**  | Convex             | Real-time sync, serverless, TypeScript-native |
| **Auth**      | Better Auth        | Self-hosted OAuth with Google sign-in         |
| **Edge**      | Cloudflare Workers | Fast, cheap, global edge network              |
| **Styling**   | Tailwind CSS v4    | Utility-first styling with custom theme       |
| **UI**        | shadcn/ui          | 14 accessible React components                |
| **Forms**     | React Hook Form    | Performant forms with Zod validation          |
| **Charts**    | Recharts           | Composable charting library                   |
| **Animation** | Framer Motion      | Drag interactions and smooth animations       |
| **Toasts**    | Sonner             | Beautiful toast notifications                 |

## 📦 Project Structure

```
g-convex-v2/
├── convex/                    # Convex backend
│   ├── schema.ts             # Database schema (products, votes, profiles)
│   ├── products.ts           # Product CRUD with weighted averages
│   ├── votes.ts              # Rate-limited voting (10/min)
│   ├── profiles.ts           # Gamification (points, badges, leaderboard)
│   ├── lib/
│   │   └── gamification.ts   # Badge logic and point calculations
│   └── auth.ts               # Better Auth with Google OAuth
├── src/
│   ├── routes/               # File-based routing
│   │   ├── index.tsx         # Home with matrix chart & leaderboard
│   │   ├── product/$name.tsx # Product detail with voting panel
│   │   ├── profile.tsx       # User profile with badges & history
│   │   ├── leaderboard.tsx   # Full leaderboard (top 50)
│   │   ├── login.tsx         # Google OAuth login page
│   │   └── admin.tsx         # Admin dashboard (RBAC protected)
│   ├── components/
│   │   ├── dashboard/        # 13 core UI components
│   │   │   ├── MatrixChart.tsx          # Recharts scatter plot
│   │   │   ├── ProductCard.tsx          # Product tile with quadrant color
│   │   │   ├── ProductList.tsx          # Product grid with search
│   │   │   ├── VotingPanel.tsx          # Quick vote presets
│   │   │   ├── FineTunePanel.tsx        # Slider-based voting
│   │   │   ├── Leaderboard.tsx          # Top 5 contributors
│   │   │   ├── BadgeDisplay.tsx         # Badge showcase
│   │   │   ├── StatsCard.tsx            # Stat display widget
│   │   │   ├── AddProductDialog.tsx     # Create product form
│   │   │   ├── EditProductDialog.tsx    # Edit product form
│   │   │   └── DeleteProductButton.tsx  # Delete confirmation
│   │   ├── Navigation.tsx    # Header with auth & language switcher
│   │   └── LanguageSwitcher.tsx # EN/HU toggle
│   ├── hooks/
│   │   ├── use-anonymous-id.ts    # Anonymous voter ID management
│   │   ├── use-geolocation.ts     # GPS location hook
│   │   ├── use-translation.ts     # i18n hook
│   │   └── use-vote-migration.ts  # Migrate anonymous votes on login
│   ├── locales/
│   │   ├── en.json           # English translations
│   │   └── hu.json           # Hungarian translations
│   └── styles/
│       └── globals.css       # Tailwind base + quadrant colors
└── docs/
    ├── AI_AGENT_CONTEXT.md      # Context for AI coding agents
    ├── AI_GUIDELINES.md         # AI assistant best practices
    ├── AUTH_SOLUTION.md         # Auth integration details
    ├── CLOUDFLARE_FEATURES.md   # Cloudflare setup guide
    ├── OPTIONAL_FEATURES.md     # Optional extensions
    ├── RBAC.md                  # Role-based access control
    └── planning/                # Internal project planning (not linked)
```

## 🎮 How It Works

### Voting System
- **Anonymous Voting**: Generate unique ID in localStorage, votes weighted 1x
- **Registered Voting**: Sign in with Google, votes weighted 2x
- **Vote Migration**: Anonymous votes transfer to your account on sign-in
- **Rate Limiting**: 10 votes per minute using `@convex-dev/rate-limiter`
- **Quick Presets**: Vote with 4 quadrant buttons (Holy Grail, Survivor Food, etc.)
- **Fine-Tune Mode**: Adjust safety/taste with sliders and drag on chart

### Gamification
- **Points**: 10 pts/vote, 50 pts/product, 100 pts/streak day 7+
- **Badges**: Unlock achievements for milestones (1, 10, 100 votes, etc.)
- **Streaks**: Vote daily to maintain streak multiplier
- **Leaderboard**: Real-time ranking by total points

### Admin Tools
- **Product Management**: Add, edit, delete any product
- **Analytics Dashboard**: View product stats and vote counts
- **RBAC Protection**: Admin routes check user role from profiles table

## 🚀 Quick Start

```bash
# 1. Clone & install
git clone <this-repo>
cd g-convex-v2
npm install

# 2. Setup Convex
npx convex dev
# Follow prompts to create new project or link existing

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your values (see Configuration below)

# 4. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## ⚙️ Configuration

### Environment Variables

Create `.env.local` with:

```bash
# Convex
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Better Auth
BETTER_AUTH_SECRET=your-secret-here    # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000  # Your app URL

# Google OAuth (https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env.local`

### Convex Setup

The database schema will be automatically deployed when you run `npx convex dev`. The schema includes:

- **products**: Store gluten-free products with calculated averages
- **votes**: Track all votes with user, anonymous, and location data
- **profiles**: Gamification data (points, badges, streaks, admin role)

### Making a User Admin

After signing in once, run in Convex dashboard:

```typescript
// In Convex dashboard console
const user = await db.query("profiles").filter(q => q.eq(q.field("email"), "your-email@example.com")).first();
await db.patch(user._id, { isAdmin: true });
```

## � Troubleshooting

### TypeScript Errors After Clone

If you see errors like `Cannot find module './routeTree.gen'`:

```bash
# Generate route tree and Convex types
npx convex dev --once
npx @tanstack/router-cli generate
npm run typecheck
```

### TanStack Start API Errors

If you see errors about `StartClient` or `createStartHandler`:

- TanStack Start v1.154+ simplified entry points — `start.tsx` exports `undefined`, `server.ts` uses default handler
- Import `StartClient` from `@tanstack/react-start/client` (not root)
- Import handler from `@tanstack/react-start/server-entry`

### Convex Schema Errors

If you see `v.id('users')` type errors:

- Better Auth user IDs are strings, use `v.string()` not `v.id('users')`

## 📱 Mobile Development (iOS/Android)

This app uses **Capacitor** to run on iOS and Android with the same web codebase.

### Architecture: SSR (Web) + SPA Shell (Mobile)

TanStack Start is an SSR framework — for web deployment on Cloudflare Workers, the server renders HTML dynamically. Capacitor needs static files. We use TanStack Start's **SPA Mode** to generate both from a single build:

```
npm run build
  ├── SSR build → dist/server/  (deployed to Cloudflare Workers)
  └── SPA shell → dist/client/index.html  (bundled into native apps by Capacitor)

npx cap sync  →  copies dist/client/* into iOS and Android projects
```

On mobile, auth is handled client-side via `ConvexBetterAuthProvider` (the SSR `getAuth()` function gracefully falls back to `null`). Auth requests go directly to the Convex backend URL (`VITE_CONVEX_SITE_URL`).

### Initial Setup

```bash
# 1. Build the web app (includes SPA shell generation)
npm run build

# 2. Add native platforms (first time only)
npx cap add ios
npx cap add android

# 3. Sync web assets to native projects
npx cap sync

# 4. Open in native IDEs
npm run cap:ios      # Opens Xcode
npm run cap:android  # Opens Android Studio
```

### Development Workflow

```bash
# After making code changes:
npm run build && npx cap sync

# Then press Run (▶) in Xcode or Android Studio
```

### Android Build Fix (Automatic)

The project includes an automatic fix for a known Android Gradle Plugin 9.x compatibility issue with Capacitor v8 plugins. A `postinstall` script (`scripts/patch-capacitor-android.sh`) runs automatically after `npm install` and patches the deprecated ProGuard configuration.

**If Android builds fail after `npm install`**, manually run:
```bash
bash scripts/patch-capacitor-android.sh
```

Then in Android Studio: **File → Sync Project with Gradle Files**

See `.github/copilot-instructions.md` for technical details.
## �📝 Scripts

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run preview      # Preview production build
npm run typecheck    # Check TypeScript types
npx convex dev       # Start Convex in dev mode
npx convex deploy    # Deploy Convex functions
```

## 🌐 Deployment

### Cloudflare Workers (Recommended)

```bash
# 1. Install Wrangler CLI
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Deploy Convex to production
npx convex deploy --prod

# 4. Update .env with production Convex URL
# VITE_CONVEX_URL=https://your-prod-deployment.convex.cloud

# 5. Deploy to Cloudflare Workers
npm run build
wrangler deploy
```

### Netlify / Vercel

See [docs/NETLIFY_SETUP.md](docs/NETLIFY_SETUP.md) or [docs/VERCEL_SETUP.md](docs/VERCEL_SETUP.md) for detailed instructions.

## 🎨 Customization

### Adding Products

Products can be added:
1. **Via Admin UI**: Sign in as admin, go to `/admin`
2. **Via Seed Script**: Run `node convex/seed.js` (create this script)
3. **Via Convex Dashboard**: Manually insert into `products` table

### Translations

Add new languages in `src/locales/`:

```typescript
// src/locales/es.json
{
  "home": {
    "title": "Matriz G",
    "subtitle": "Sistema de calificación de productos sin gluten"
  }
  // ... more translations
}
```

Update `use-translation.ts` to support new locale codes.

### Quadrant Colors

Customize in [src/styles/globals.css](src/styles/globals.css):

```css
:root {
  --holy-grail: 34 197 94;      /* Green */
  --survivor-food: 59 130 246;  /* Blue */
  --russian-roulette: 251 146 60; /* Orange */
  --the-bin: 239 68 68;         /* Red */
}
```

## 🤝 Contributing

This app was built following the G-Matrix specification. To contribute:

1. Check [docs/PROJECT_PURPOSE.md](docs/PROJECT_PURPOSE.md) for requirements
2. Follow the existing code patterns (TanStack Start + Convex)
3. Maintain TypeScript type safety
4. Add translations for new UI strings
5. Test both anonymous and authenticated flows

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- Built with [Convex](https://convex.dev) real-time database
- Powered by [TanStack Start](https://tanstack.com/start) framework
- Deployed on [Cloudflare Workers](https://workers.cloudflare.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)

---

**Made with 🌾 for the celiac community**
