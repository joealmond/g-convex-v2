/**
 * Pure client-safe allergen matching helpers.
 * Keep behavior aligned with the backend version in convex/dietaryProfiles.ts.
 */

export function findAllergenConflicts(
  productAllergens: string[] | undefined,
  avoidedAllergens: string[],
): string[] {
  if (!productAllergens || productAllergens.length === 0) return []
  if (avoidedAllergens.length === 0) return []

  const avoidedSet = new Set(avoidedAllergens.map((allergen) => allergen.toLowerCase()))
  return productAllergens.filter((allergen) => avoidedSet.has(allergen.toLowerCase()))
}