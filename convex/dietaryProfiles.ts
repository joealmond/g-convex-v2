/**
 * Dietary Profiles — Boolean Allergen Avoidance
 * 
 * Users select which allergens they want to avoid (e.g., gluten, milk, nuts).
 * Products declare which allergens they contain.
 * Matching is a deterministic set intersection.
 */

import { v } from 'convex/values'

import { requireAuth } from './lib/authHelpers'
import { authMutation, publicQuery } from './lib/customFunctions'
import { internalMutation } from './_generated/server'

/** Map old condition types to new allergen IDs */
const CONDITION_TO_ALLERGEN: Record<string, string> = {
  celiac: 'gluten',
  'gluten-sensitive': 'gluten',
  lactose: 'milk',
  soy: 'soy',
  nut: 'nuts',
}

/**
 * Get user's dietary profile (avoided allergens list)
 * Uses publicQuery so it returns null during sign-out
 * rather than throwing "Authentication required"
 */
export const getUserProfile = publicQuery({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx).catch(() => null)
    if (!user) return null

    const profile = await ctx.db
      .query('dietaryProfiles')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first()
    
    return profile || null
  },
})

/**
 * Update user's dietary profile — set which allergens to avoid.
 * Accepts a flat array of allergen IDs from appConfig.allergens.
 */
export const updateProfile = authMutation({
  args: {
    avoidedAllergens: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Deduplicate and lowercase for consistency
    const allergens = [...new Set(args.avoidedAllergens.map(a => a.toLowerCase()))]
    
    const existing = await ctx.db
      .query('dietaryProfiles')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId))
      .first()
    
    const now = Date.now()
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        avoidedAllergens: allergens,
        conditions: undefined, // clear legacy field
        updatedAt: now,
      })
      return existing._id
    } else {
      return await ctx.db.insert('dietaryProfiles', {
        userId: ctx.userId,
        avoidedAllergens: allergens,
        createdAt: now,
        updatedAt: now,
      })
    }
  },
})

/**
 * Get user's avoided allergens list.
 * Returns string[] — empty if no profile or not authenticated.
 */
export const getAvoidedAllergens = publicQuery({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx).catch(() => null)
    if (!user) return []

    const profile = await ctx.db
      .query('dietaryProfiles')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first()
    
    return profile?.avoidedAllergens ?? []
  },
})

/**
 * Pure utility: check if a product's allergens conflict with a user's avoided allergens.
 * Returns the list of conflicting allergen IDs.
 * 
 * This is exported for use in tests and other modules.
 */
export function findAllergenConflicts(
  productAllergens: string[] | undefined,
  avoidedAllergens: string[],
): string[] {
  if (!productAllergens || productAllergens.length === 0) return []
  if (avoidedAllergens.length === 0) return []
  
  const avoidedSet = new Set(avoidedAllergens.map(a => a.toLowerCase()))
  return productAllergens.filter(a => avoidedSet.has(a.toLowerCase()))
}

/**
 * Migration: convert old conditions-based profiles to avoidedAllergens.
 * Run once via dashboard or CLI: npx convex run dietaryProfiles:migrateToAllergens
 * Safe to re-run — skips already-migrated documents.
 */
export const migrateToAllergens = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query('dietaryProfiles').collect()
    let migrated = 0

    for (const profile of profiles) {
      // Skip if already migrated
      if (profile.avoidedAllergens !== undefined) continue

      // Convert old conditions to allergen IDs
      const conditions = (profile as any).conditions as Array<{ type: string; severity: number }> | undefined
      const allergenSet = new Set<string>()
      if (conditions) {
        for (const c of conditions) {
          const allergenId = CONDITION_TO_ALLERGEN[c.type]
          if (allergenId) allergenSet.add(allergenId)
        }
      }

      await ctx.db.patch(profile._id, {
        avoidedAllergens: [...allergenSet],
        conditions: undefined, // remove legacy field
      })
      migrated++
    }

    return { migrated, total: profiles.length }
  },
})
