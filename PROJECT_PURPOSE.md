# G-Convex V2 Project Purpose

## 🎯 Project Goals

This repository has **two primary objectives**:

### 1. Build the G-Matrix Application

Replicate the full **G-Matrix** (gluten-free product rating) application from the source template:
- **Source**: `/Users/mandulaj/dev/source/g-convex`
- **Target**: This repository (`g-convex-v2`)

All functionality from the original g-convex must be implemented with **100% feature parity**, including:
- ✅ G-Matrix quadrant visualization (Safety vs Taste, Price vs Taste)
- ✅ Product voting system (Quick vote + Fine-tune)
- ✅ Anonymous and authenticated voting
- ✅ Gamification system (points, badges, streaks)
- ✅ AI image analysis (Google Gemini)
- ✅ Geolocation features (GPS tagging, "Near Me" filtering)
- ✅ Admin features (product management, impersonation)
- ✅ Internationalization (English + Hungarian)
- ✅ SSR deployment

### 2. Document Template Improvements

While building the app, we document **insights, gaps, and improvements** for the original template:
- **Original Template**: `/Users/mandulaj/dev/source/convex-tanstack-cloudfare`
- **Documentation Location**: `./doctemplateimprovements/`

Every issue, missing feature, or improvement opportunity discovered during development should be documented for upstream contribution.

---

## 📁 Repository Structure

```
g-convex-v2/
├── PROJECT_PURPOSE.md          # This file - project goals
├── AI_AGENT_CONTEXT.md         # System prompt for AI agents
├── doctemplateimprovements/    # Template improvement documentation
│   ├── README.md               # Overview of improvement findings
│   ├── MISSING_FEATURES.md     # Features missing from template
│   ├── DOCUMENTATION_GAPS.md   # Documentation improvements needed
│   └── PATTERN_IMPROVEMENTS.md # Better patterns discovered
├── convex/                     # Backend (Convex functions + schema)
├── src/                        # Frontend (TanStack Start + React)
├── docs/                       # Original template documentation
├── infrastructure/             # Terraform IaC
└── scripts/                    # Utility scripts
```

---

## 🔄 Workflow

1. **Analyze** - Study g-convex source app for each feature
2. **Implement** - Build the feature in g-convex-v2 using the template base
3. **Document** - Record any template shortcomings in `doctemplateimprovements/`
4. **Iterate** - Continue until full feature parity achieved

---

## 🛠️ Technology Stack Comparison

| Component | Original Template | G-Matrix Source | G-Convex-V2 |
|-----------|------------------|-----------------|-------------|
| **Framework** | TanStack Start | TanStack Start | TanStack Start |
| **Backend** | Convex | Convex | Convex |
| **Auth** | Better Auth | Better Auth | Better Auth |
| **Deployment** | Cloudflare Workers | Netlify | Cloudflare Workers |
| **Styling** | Tailwind CSS v4 | Tailwind CSS v4 | Tailwind CSS v4 |
| **UI Library** | None (manual) | shadcn/ui | shadcn/ui (to add) |
| **Charts** | None | Recharts | Recharts (to add) |
| **i18n** | None | Custom | Custom (to add) |
| **Forms** | None | react-hook-form | react-hook-form (to add) |

---

## 📋 Feature Implementation Checklist

### Core Features
- [ ] Database schema matching g-convex
- [ ] Product CRUD operations
- [ ] Voting system with weighted averages
- [ ] Anonymous ID management
- [ ] Vote migration (anon → registered)

### Visualization
- [ ] G-Matrix chart component
- [ ] Coordinate grid for voting
- [ ] Product dots with quadrant coloring
- [ ] Mode switching (Vibe/Value)

### Gamification
- [ ] Points system
- [ ] Badge definitions
- [ ] Streak tracking
- [ ] Profile page with stats

### AI Features
- [ ] Gemini integration
- [ ] Image upload
- [ ] Product extraction
- [ ] Ingredient analysis

### Admin Features
- [ ] Admin toolbar
- [ ] Product management
- [ ] User impersonation
- [ ] Vote management

### UX Features
- [ ] Geolocation integration
- [ ] Store tagging
- [ ] Language switching
- [ ] Mobile responsiveness

---

## 📅 Started

**Date**: January 2026

---

## 📝 Notes

- Always use the **latest versions** of all dependencies
- Check official documentation for breaking changes
- Document any version-specific issues in `doctemplateimprovements/`
