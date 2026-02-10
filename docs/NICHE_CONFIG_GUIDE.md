# Niche Configuration Guide

> How to adapt G-Matrix for any product niche (vegan, keto, organic, etc.) by editing configuration files only — no component code changes needed.

---

## Overview

G-Matrix is built as a **niche-agnostic product rating platform**. The current niche is "gluten-free products", but the entire identity — app name, rating dimensions, quadrant names, store defaults, preset labels — lives in a single config file.

**To swap niches, you need to edit exactly 2-3 files:**

1. `src/lib/app-config.ts` — Central niche configuration
2. `src/locales/en.json` — English translations
3. `src/locales/hu.json` — Hungarian translations (or your target locales)

## The Config File: `src/lib/app-config.ts`

This file exports `appConfig` — a single object that defines the app's identity.

### Sections

#### 1. Basic Identity
```ts
appName: "G-Matrix",
categoryTerm: "gluten-free products",
tagline: "Community-rated celiac-safe products",
```

Change these to match your niche:
```ts
appName: "V-Matrix",
categoryTerm: "vegan products",
tagline: "Community-rated vegan food finder",
```

#### 2. Dimensions (Rating Axes)

The app uses a 2-axis voting system. Each axis has a key, label, question, and presets:

```ts
dimensions: {
  axis1: {
    key: "safety",            // Field name in database
    label: "Safety",          // Display label
    question: "How safe is it?",
    presets: [
      { value: 90, label: "Clean", emoji: "✅", description: "Completely safe" },
      { value: 50, label: "Sketchy", emoji: "⚠️", description: "Some concerns" },
      { value: 10, label: "Wrecked", emoji: "🚫", description: "Unsafe" },
    ],
  },
  axis2: {
    key: "taste",
    label: "Taste",
    question: "How does it taste?",
    presets: [
      { value: 90, label: "Yass!", emoji: "😋", description: "Delicious" },
      { value: 50, label: "Meh", emoji: "😐", description: "Acceptable" },
      { value: 10, label: "Pass", emoji: "🤢", description: "Terrible" },
    ],
  },
}
```

For a vegan app, you might change axis1 to "Vegan Purity" and axis2 to "Taste":
```ts
axis1: {
  key: "safety",  // Keep DB field name for compatibility
  label: "Purity",
  question: "How vegan is it?",
  presets: [
    { value: 90, label: "100% Vegan", emoji: "🌱", description: "Fully plant-based" },
    { value: 50, label: "Mostly", emoji: "⚠️", description: "Minor concerns" },
    { value: 10, label: "Not Vegan", emoji: "❌", description: "Contains animal products" },
  ],
},
```

> **Note:** The database fields are always named `safety` and `taste` for historical reasons. The labels are purely cosmetic — the math is generic threshold-based scoring.

#### 3. Quadrants

The scatter chart divides products into 4 quadrants:

```ts
quadrants: {
  topRight: { label: "Holy Grail", ... },    // High safety + High taste
  topLeft: { label: "Good Soldier", ... },    // High safety + Low taste
  bottomRight: { label: "Guilty Pleasure", ... }, // Low safety + High taste
  bottomLeft: { label: "Avoid", ... },        // Low safety + Low taste
}
```

#### 4. Store Defaults

Default store options shown in the voting UI, per locale:

```ts
storeDefaults: {
  en: ["Walmart", "Costco", "Whole Foods", ...],
  hu: ["Tesco", "Lidl", "Aldi", ...],
}
```

#### 5. Colors & Thresholds

Safety score color thresholds and chart colors are also in the config.

## How Components Use the Config

Components **never hardcode niche strings**. They read from config or translations:

```tsx
// ❌ Wrong — hardcoded niche string
<h2>Gluten Safety Score</h2>

// ✅ Correct — from translations
<h2>{t('voting.safety')}</h2>

// ✅ Correct — from config
<h2>{appConfig.dimensions.axis1.label} Score</h2>
```

## Backend Compatibility

The Convex backend (`convex/`) is **niche-agnostic**. It operates on:
- Two numeric axes (`safety` and `taste` fields, 0-100)
- A price axis (1-5 scale)
- Generic threshold-based math for weighted averages

You do NOT need to change any backend code when swapping niches.

## Checklist: Swapping Niches

- [ ] Edit `src/lib/app-config.ts` — all sections
- [ ] Update `src/locales/en.json` — niche-specific translation keys
- [ ] Update `src/locales/hu.json` — (or add your target locale)
- [ ] Update app icon in `public/icons/`
- [ ] Update `public/manifest.json` — app name, description
- [ ] Update Capacitor config if app name changes
- [ ] Test: Search for any remaining hardcoded niche strings
- [ ] Deploy both Convex and web

## Finding Hardcoded Strings

```bash
# Search for gluten-specific strings that shouldn't be in components
grep -r "gluten\|celiac\|Holy Grail" src/components/ src/routes/
# These should only appear in app-config.ts and locale files
```
