# Time-Decay Algorithm

> How G-Matrix weights older votes less to keep product ratings fresh and relevant.

---

## Overview

Product ratings use **exponential time-decay** so that recent votes have more influence than older ones. This prevents "stale" ratings where a product that was great 2 years ago but declined in quality keeps its high score.

## Algorithm

Each vote's weight is calculated as:

$$w = w_{base} \times r^{d}$$

Where:
- $w_{base}$ = base weight (2 for registered users, 1 for anonymous)
- $r$ = decay rate (default: 0.995, configurable via admin settings)
- $d$ = age of vote in days

### Examples

| Vote age | Decay factor ($0.995^d$) | Effective weight (registered) |
|---|---|---|
| Today | 1.000 | 2.000 |
| 7 days | 0.965 | 1.931 |
| 30 days | 0.861 | 1.722 |
| 90 days | 0.638 | 1.277 |
| 180 days | 0.407 | 0.815 |
| 365 days | 0.163 | 0.327 |

With the default rate of 0.995:
- Votes lose ~50% weight after ~139 days
- After 1 year, a vote has ~16% of its original weight
- Votes never reach zero — they asymptotically approach 0

## Weighted Average Calculation

For each product dimension (safety, taste, price):

$$\bar{x} = \frac{\sum_{i} x_i \cdot w_i}{\sum_{i} w_i}$$

Where $x_i$ is the vote value and $w_i$ is the time-decayed weight.

## Configuration

Time-decay is configured via the admin settings panel, stored in the `settings` table:

| Setting Key | Type | Default | Description |
|---|---|---|---|
| `TIME_DECAY_ENABLED` | boolean | `false` | Master toggle for time-decay |
| `DECAY_RATE` | number | `0.995` | Per-day decay factor (0-1) |

### Tuning the Decay Rate

| Rate | Half-life (days) | Use case |
|---|---|---|
| 0.999 | ~693 | Very slow decay — votes stay relevant for years |
| 0.997 | ~231 | Moderate — good for stable product categories |
| 0.995 | ~139 | Default — balanced freshness |
| 0.990 | ~69 | Aggressive — for fast-changing product markets |
| 0.980 | ~34 | Very aggressive — recent votes dominate |

Half-life formula: $t_{1/2} = \frac{\ln(0.5)}{\ln(r)}$

## Execution

Time-decay recalculation runs as a **daily cron job** at midnight UTC:

```
crons.daily("apply-time-decay", { hourUTC: 0, minuteUTC: 0 }, ...)
```

The cron calls `votes.recalculateAllProducts`, which:
1. Checks if time-decay is enabled (`TIME_DECAY_ENABLED` setting)
2. If disabled, skips entirely
3. If enabled, processes all products in batches of 25
4. Each batch recalculates weighted averages with time-decay applied
5. Remaining batches are scheduled with 1-second stagger to spread load

## Implementation

Key files:
- `convex/votes.ts` → `recalculateProduct()` — core algorithm
- `convex/votes.ts` → `recalculateAllProducts()` — cron handler with batching
- `convex/votes.ts` → `recalculateProductBatch()` — batch processor
- `convex/crons.ts` — daily cron schedule
- `convex/settings.ts` — admin settings CRUD
- `convex/lib/gamification.ts` → `VOTE_WEIGHTS` — base weight constants

## Vote Weights

| User Type | Base Weight |
|---|---|
| Registered user | 2 |
| Anonymous user | 1 |

Registered users have 2× the voting power of anonymous users, before time-decay is applied.
