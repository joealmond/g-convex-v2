# Scoring System — Per-Allergen Safety & Thumbs Voting

> This document describes the scoring architecture for G-Matrix: how products are rated, how initial allergen evidence is seeded, how community votes work, and how personalized safety is computed.

---

## Table of Contents

1. [Overview](#overview)
2. [Dimensions](#dimensions)
3. [Per-Allergen Safety Scoring](#per-allergen-safety-scoring)
4. [Taste Scoring](#taste-scoring)
5. [Price Scoring](#price-scoring)
6. [Vote Lifecycle](#vote-lifecycle)
7. [Personalized Safety](#personalized-safety)
8. [Universal Safety](#universal-safety)
9. [Vote Convenience Scores](#vote-convenience-scores)
10. [Schema Reference](#schema-reference)
11. [Key Files](#key-files)
12. [Math Examples](#math-examples)
13. [Design Rationale](#design-rationale)
14. [Quadrant Visualization](#quadrant-visualization)
15. [Data Source Labels](#data-source-labels)

---

## Overview

G-Matrix rates products on **three dimensions**:

| Dimension | Method | Stored On Product | Computed Score |
|-----------|--------|-------------------|----------------|
| **Safety** | Per-allergen thumbs 👍/👎 | `allergenScores` (map) | Internal 0–100 evidence score + user-facing state |
| **Taste** | Single thumbs 👍/👎 | `tasteUpVotes`, `tasteDownVotes` | 0–100 ratio |
| **Price** | 1–5 subjective scale + optional exact price | `avgPrice`, `exactPrices` | 1–5 average |

Safety uses **Bayesian updating** — the initial allergen classification seeds a conservative prior, and community thumbs votes shift the score over time. With enough community votes, the prior becomes negligible.

Important: the allergen score is **not a lab measurement** and should not be interpreted as proof that an allergen is absent. It is a structured estimate derived from initial product evidence plus community feedback.

---

## Dimensions

### Safety (Per-Allergen)

Unlike traditional single-score safety ratings, G-Matrix tracks safety **per allergen**. A product may be safe for someone avoiding gluten but unsafe for someone avoiding milk.

**Tracked allergens** (defined in `appConfig.allergens`):
| ID | Label | Emoji |
|----|-------|-------|
| `gluten` | Gluten | 🌾 |
| `milk` | Milk & Dairy | 🥛 |
| `soy` | Soy | 🫘 |
| `nuts` | Nuts | 🥜 |
| `eggs` | Eggs | 🥚 |

Each allergen has an independent score composed of:
- **Initial classification**: `contains` / `free-from` / `unknown` (set at product creation from ingredient analysis, barcode data, or community entry)
- **Community votes**: aggregated thumbs up/down from all users

The internal numeric score is then distilled into a simple user-facing state:
- **Likely unsafe**
- **Uncertain**
- **Likely safe**

This keeps the product understandable for end users while preventing weak evidence from looking more certain than it really is.

### Taste

A single binary dimension. Users vote 👍 or 👎 on taste. The score is a ratio of positive votes with a neutral Bayesian prior.

### Price

Two components:
1. **Subjective scale** (1–5): Budget → Fair → Moderate → Premium → Luxury
2. **Exact price** (optional): Amount + currency code (e.g., `{ amount: 4.99, currency: "EUR" }`)

---

## Per-Allergen Safety Scoring

### The Bayesian Formula

For each allergen on a product:

```
score = (virtualUp + communityUp) / (virtualUp + virtualDown + communityUp + communityDown) × 100
```

### Initial Virtual Votes (Prior)

The initial classification sets **virtual votes** that act as a Bayesian prior:

| Initial Classification | Virtual 👍 | Virtual 👎 | Initial Score |
|------------------------|-----------|-----------|---------------|
| `free-from` | 2 | 1 | **67** |
| `contains` | 0 | 2 | **0** |
| `unknown` | 1 | 1 | **50** |

These virtual votes are **never removed** — they're baked into the formula. As community votes accumulate, the virtual votes become proportionally less significant.

This prior is intentionally **asymmetric**:
- A product classified as `contains` starts strict.
- A product classified as `free-from` starts positive, but not as certain truth.
- A product classified as `unknown` stays neutral.

The goal is to reduce false-safe impressions on low-evidence products while keeping the system simple.

### How Initial Classification Works

When a product is created:
1. **Initial evidence is gathered** (barcode data, ingredient scan, AI estimate, or community entry)
2. For each known allergen:
   - If allergen appears in `product.allergens` → `contains`
   - If allergen appears in `product.freeFrom` → `free-from`
   - Otherwise → `unknown`
3. `buildInitialAllergenScores()` creates the initial `allergenScores` map

**Example** — A product with `allergens: ["gluten"]` and `freeFrom: ["milk", "soy"]`:
```
{
  "gluten": { aiBase: "contains",  upVotes: 0, downVotes: 0 },  // score = 0
  "milk":   { aiBase: "free-from", upVotes: 0, downVotes: 0 },  // score = 67
  "soy":    { aiBase: "free-from", upVotes: 0, downVotes: 0 },  // score = 67
  "nuts":   { aiBase: "unknown",   upVotes: 0, downVotes: 0 },  // score = 50
  "eggs":   { aiBase: "unknown",   upVotes: 0, downVotes: 0 },  // score = 50
}
```

### Community Overrides the Initial Classification

The Bayesian model means community votes can **override** the initial classification:

| Scenario | Result |
|----------|--------|
| AI says `contains` + 15 users vote 👍, 2 vote 👎 | Score ≈ 79 (community overrides) |
| AI says `free-from` + 0 users vote 👍, 5 vote 👎 | Score = 25 (community flags issue) |
| AI says `unknown` + 10 users vote 👍 | Score ≈ 92 (community establishes safety) |

This handles real-world edge cases:
- Initial extraction mistakes a "may contain" warning for actual allergen content
- Products reformulated after initial analysis
- AI misses a cross-contamination risk that users notice

### User-Facing Safety States

The internal numeric score is not shown as absolute truth. Instead, each allergen should be presented with a conservative state:

| State | Rule |
|-------|------|
| **Likely unsafe** | score `<= 25` |
| **Likely safe** | score `>= 80` **and** at least 5 independent votes for that allergen |
| **Uncertain** | everything else |

This means most new products start as **uncertain**, even if the initial evidence is positive.

Why this matters:
- `Uncertain` covers low evidence, conflicting evidence, and missing evidence.
- `Likely safe` requires both a high score and some minimum community support.
- `Likely unsafe` is easier to reach than `Likely safe`, which matches allergy risk asymmetry.

### Confidence

Confidence should stay simple and visible next to the allergen result:

| Confidence | Rule |
|------------|------|
| **Low** | 0-2 independent votes |
| **Medium** | 3-9 independent votes |
| **High** | 10+ independent votes |

Confidence is not a separate score. It is a compact summary of how much community evidence exists behind the current state.

---

## Taste Scoring

### Formula

```
score = (1 + upVotes) / (2 + upVotes + downVotes) × 100
```

Uses **1 virtual 👍 + 1 virtual 👎** as prior → starts at exactly **50** with 0 votes.

### Examples

| Up Votes | Down Votes | Score |
|----------|------------|-------|
| 0 | 0 | 50 |
| 1 | 0 | 67 |
| 5 | 0 | 86 |
| 5 | 5 | 50 |
| 0 | 5 | 14 |
| 20 | 3 | 84 |

---

## Price Scoring

### Subjective Scale

Users select one of 5 preset levels:

| Level | Label | Emoji | Internal Value |
|-------|-------|-------|----------------|
| 1 | Budget | $ | 1 |
| 2 | Fair | $$ | 2 |
| 3 | Moderate | $$$ | 3 |
| 4 | Premium | $$$$ | 4 |
| 5 | Luxury | $$$$$ | 5 |

Product's `avgPrice` is the simple average of all vote prices.

### Exact Price (Optional)

Users can optionally enter an exact price (e.g., `€4.99`). These are stored in `product.exactPrices` as an array of `{ amount, currency, storeName? }` for price comparison features.

---

## Vote Lifecycle

### 1. Product Creation

```
Initial evidence → buildInitialAllergenScores(allergens, freeFrom, knownIds)
                 → Product created with allergenScores, averageSafety, averageTaste
```

`averageSafety` = universal worst-case (min of all allergen scores)
`averageTaste` = 50 (no votes yet)

### 2. User Casts Vote

A vote payload (`ThumbsVotePayload`) contains:
```typescript
{
  allergenVotes: { "gluten": "up", "milk": "down" },  // Per-allergen thumbs
  tasteVote: "up",                                      // Taste thumb
  price: 3,                                             // Price scale 1-5
  exactPrice: { amount: 4.99, currency: "EUR" },        // Optional
  storeName: "Aldi",                                     // Optional
}
```

All fields except at least one vote are optional — users don't have to vote on everything.

### 3. Recalculation

After each vote, `recalculateProduct()` runs:
1. Fetches **all votes** for the product
2. `aggregateAllergenVotes()` — counts per-allergen up/down from all votes (preserves AI base)
3. `aggregateTasteVotes()` — counts taste up/down (handles legacy numeric taste too)
4. Computes `computeAllergenScore()` for each allergen → updates `allergenScores`
5. `computeUniversalSafety()` → updates `averageSafety`
6. `computeTasteScore()` → updates `averageTaste`
7. Price average → updates `avgPrice`
8. Exact prices → appends to `exactPrices`

### 4. "I Agree" Quick Vote

If a user agrees with the current classification, they can tap "I Agree" which:
- For each allergen:
  - `contains` → votes 👎 (agrees the allergen is present)
  - `free-from` → votes 👍 (agrees the product is safe)
  - `unknown` → skipped (no opinion)
- Taste: 👍

This provides a low-friction way to reinforce the existing evidence.

---

## Personalized Safety

Each user has a **dietary profile** listing their avoided allergens (e.g., `["gluten", "milk"]`).

### Computation

```
personalizedSafety = MIN(allergenScore for each allergen in user.avoidedAllergens)
```

**Logic**:
1. For each allergen in user's `avoidedAllergens` → compute that allergen's score
2. Return the **minimum** (worst-case = the user's limiting allergen)
3. If user has no dietary profile (empty array) → fall through to universal safety
4. If product has no `allergenScores` data → return 50 (unknown)

### Why Minimum?

If a product looks likely safe for gluten (score=98) but risky for milk (score=15), a user avoiding both should see **15** — the milk risk is the bottleneck.

### Display

- **RatingBars** should show personalized safety as a conservative recommendation, not a guarantee
- **VotingSheet** shows per-allergen scores with individual score bars
- **Feed cards** use `averageSafety` (universal) for consistent sorting

---

## Universal Safety

Used for **non-personalized contexts** (feed sorting, chart default, anonymous users):

```
universalSafety = MIN(allergenScore for ALL allergens on the product)
```

Stored as `product.averageSafety` for backward-compatible indexing and sorting.

Important: universal safety is a coarse ranking field. It should not be presented as more reliable than the underlying per-allergen states and confidence.

---

## Vote Convenience Scores

Each vote stores auto-computed `safety` and `taste` numeric fields for chart display:

- **safety**: Computed via `computeVoteSafety()` — uses the product's AI base + this vote's allergen thumbs, takes the min across voted allergens. Gives each vote a meaningful position on the safety axis.
- **taste**: Computed via `computeVoteTaste()` — `up` → 75, `down` → 25, no vote → 50.

These are **derived convenience fields**, not user input. They're written at vote creation/update time and consumed by charts (`AllVotesChart`, `ProductChartTabs`), community feed, and admin views.

---

## Schema Reference

### Products Table — Scoring Fields

```typescript
// Per-allergen safety scores (new system)
allergenScores: v.optional(v.record(v.string(), v.object({
  aiBase: v.union(v.literal('contains'), v.literal('free-from'), v.literal('unknown')),
  upVotes: v.number(),
  downVotes: v.number(),
})))

// Taste aggregates
tasteUpVotes: v.optional(v.number())
tasteDownVotes: v.optional(v.number())

// Computed convenience fields (backward-compatible)
averageSafety: v.number()  // 0-100, universal worst-case (min of all allergen scores)
averageTaste: v.number()   // 0-100, computed from taste up/down ratio

// Price
avgPrice: v.optional(v.number())  // 1-5 average
exactPrices: v.optional(v.array(v.object({
  amount: v.number(),
  currency: v.string(),
  storeName: v.optional(v.string()),
})))
```

### Votes Table — Voting Fields

```typescript
// Per-allergen thumbs voting
allergenVotes: v.optional(v.record(v.string(), v.union(v.literal('up'), v.literal('down'))))
tasteVote: v.optional(v.union(v.literal('up'), v.literal('down')))
price: v.optional(v.number())     // 1-5
exactPrice: v.optional(v.object({ amount: v.number(), currency: v.string() }))

// Auto-computed convenience fields (for chart display)
safety: v.optional(v.number())    // 0-100, derived from allergenVotes + product AI base
taste: v.optional(v.number())     // 0-100, derived from tasteVote (up=75, down=25)
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/score-utils.ts` | Frontend score computation (main reference with detailed docs) |
| `convex/lib/scoreUtils.ts` | Backend score computation (mirror of frontend + aggregate helpers) |
| `src/lib/app-config.ts` | Allergen catalog (`appConfig.allergens`) — IDs, labels, emojis |
| `convex/schema.ts` | Database schema for products and votes tables |
| `convex/votes.ts` | Vote casting (`cast`), product creation (`createProductAndVote`), recalculation |
| `src/components/product/VotingSheet.tsx` | Voting UI — per-allergen thumbs, taste thumb, price, "I Agree" |
| `src/components/product/RatingBars.tsx` | Score display bars — personalized safety, taste, price |
| `src/components/product/ReviewStep.tsx` | Product capture review — shows AI allergen classification |
| `src/routes/product/$name.tsx` | Product detail page — computes personalized safety, passes to components |
| `src/lib/__tests__/score-utils.test.ts` | 28 unit tests pinning down scoring math |

---

## Math Examples

### Example 1: New Product with Initial Evidence Only

Product has `allergens: ["gluten"]`, `freeFrom: ["milk"]`.

| Allergen | Initial Base | Virtual 👍 | Virtual 👎 | Community | Score |
|----------|--------------|-----------|-----------|-----------|-------|
| gluten | contains | 0 | 2 | — | **0** |
| milk | free-from | 2 | 1 | — | **67** |
| soy | unknown | 1 | 1 | — | **50** |
| nuts | unknown | 1 | 1 | — | **50** |
| eggs | unknown | 1 | 1 | — | **50** |

- Universal safety = min(0, 67, 50, 50, 50) = **0**
- User avoiding `[gluten]` sees personalized safety = **0**
- User avoiding `[milk]` sees personalized safety = **67**
- User avoiding `[gluten, milk]` sees personalized safety = **0** (gluten is the bottleneck)

User-facing interpretation:
- gluten: **Likely unsafe**
- milk: **Uncertain** (positive initial evidence, but not enough community support)
- soy/nuts/eggs: **Uncertain**

### Example 2: After Community Voting

Same product, after 20 community votes. Users discovered that despite "contains gluten" label, the product is actually celiac-safe (trace amounts only):

| Allergen | Initial Base | Virtual | Community 👍 | Community 👎 | Score |
|----------|--------------|---------|-------------|-------------|-------|
| gluten | contains | 0↑ 2↓ | 18 | 2 | **(0+18)/(0+2+18+2) = 82** |
| milk | free-from | 2↑ 1↓ | 12 | 0 | **(2+12)/(2+1+12+0) = 93** |
| soy | unknown | 1↑ 1↓ | 5 | 1 | **(1+5)/(1+1+5+1) = 75** |
| nuts | unknown | 1↑ 1↓ | 3 | 0 | **(1+3)/(1+1+3+0) = 80** |
| eggs | unknown | 1↑ 1↓ | 0 | 0 | **50** |

- Universal safety = min(82, 93, 75, 80, 50) = **50** (eggs is the limiting factor)
- User avoiding `[gluten]` sees: **82** (community overrode the initial classification)
- User avoiding `[milk, soy]` sees: min(93, 75) = **75**

User-facing interpretation:
- gluten: **Likely safe** if the independent vote threshold is met
- milk: **Likely safe**
- soy: **Uncertain**
- eggs: **Uncertain**

### Example 3: Taste Score Progression

| After N Votes | Up | Down | Score |
|--------------|-----|------|-------|
| 0 votes | 0 | 0 | 50 |
| 1 👍 | 1 | 0 | 67 |
| 3 👍 | 3 | 0 | 80 |
| 3 👍 + 1 👎 | 3 | 1 | 67 |
| 10 👍 + 2 👎 | 10 | 2 | 79 |
| 50 👍 + 5 👎 | 50 | 5 | 89 |

---

## Design Rationale

### Why Per-Allergen Instead of Single Score?

A single safety score is meaningless when different users avoid different allergens. A product can be perfectly safe for someone with celiac disease but dangerous for someone with a nut allergy. Per-allergen scoring gives each user a **relevant** safety number.

### Why Bayesian Instead of Simple Average?

The Bayesian prior (virtual votes from the initial classification) solves the **cold start problem**:
- New products with 0 community votes still have a structured starting point
- The prior is weak enough that community votes can shift the score significantly
- The prior is intentionally conservative for `free-from` claims, so positive early signals do not immediately look proven
- The prior never fully disappears, which means a product initially classified as `contains` requires strong community evidence to reach `likely safe` — this is a safety-conscious design choice

### Why Thumbs Instead of Sliders?

1. **Cognitive load**: "Is this safe for [allergen]? 👍/👎" is faster than "Rate safety 0-100"
2. **Per-allergen granularity**: A slider for each of 5 allergens would be overwhelming
3. **Aggregation simplicity**: Counting thumbs is more robust than averaging subjective numbers
4. **Mobile UX**: Thumbs buttons are easier tap targets than sliders on small screens

### Why Lowest Score as Personalized Safety?

Allergic reactions are driven by the **worst-case** allergen, not the average. If a product is 100% safe for 4 of your allergens but 10% safe for 1, you should see 10%.

### Why Not Wait for 50 Votes?

Requiring a high vote threshold before showing any result would leave most products permanently unusable. Instead, G-Matrix shows results from day 1 but keeps low-evidence products in the **uncertain** state until enough votes accumulate.

This preserves usability without pretending that early evidence is settled truth.

## Quadrant Visualization

The quadrant and chart views are a **visualization layer**, not a separate scoring system.

They remain useful because they help users compare products across safety, taste, and price at a glance. They do **not** interfere with the per-allergen model as long as these rules are respected:

- The quadrant should not be treated as a medical or scientific conclusion.
- The quadrant should never override the detailed allergen-level result.
- Products with low allergen confidence should still surface as **uncertain**, even if their chart position looks favorable.
- For allergy-sensitive decisions, the detailed per-allergen state is more important than the product's overall chart position.

Recommendation: **keep the quadrant**. It is useful for discovery and comparison. Just treat it as a browsing aid rather than the final authority on safety.

---

## Data Source Labels

Each product tracks where its allergen data originated via a `dataSource` field. This is **informational only** — it does not currently affect scoring, locking, or editability.

### Sources (in order of priority during capture)

| Source | Label | Badge Color | Meaning |
|--------|-------|-------------|---------|
| `openfoodfacts` | Open Food Facts | Green | Barcode matched an OFF entry with allergen data for all tracked allergens |
| `ai-ingredients` | AI Ingredients Scan | Blue | AI analyzed a photo of the ingredients list |
| `ai-estimate` | AI Estimate | Amber | AI guessed allergens from the product name/front photo only |
| `community` | Community Submitted | Gray | No automated data — everything entered by users |

### How the source is determined

During product capture, the tier is set by the **first match** in priority order:
1. If barcode lookup returned `hasAllergenData: true` → `openfoodfacts`
2. Else if ingredient image was processed successfully → `ai-ingredients`
3. Else if AI classification returned results → `ai-estimate`
4. Else → `community`

### Key design decisions

- **Same Bayesian priors** regardless of source — kept intentionally simple for now
- **No locking** — all products can be edited and voted on normally
- **Disclaimer**: "Allergen data is best effort. Always check the product label." shown on the ReviewStep during capture
- **Schema**: `dataSource` is `v.optional(v.union(...))` — older products without it simply don't show a badge
