/**
 * Tests for boolean allergen matching logic.
 * Pins down the deterministic set-intersection behavior
 * of findAllergenConflicts — the core of the allergen system.
 */

import { describe, it, expect } from 'vitest'
import { findAllergenConflicts } from '../dietaryProfiles'

describe('findAllergenConflicts', () => {
  it('returns empty array when product has no allergens', () => {
    expect(findAllergenConflicts(undefined, ['gluten', 'milk'])).toEqual([])
    expect(findAllergenConflicts([], ['gluten', 'milk'])).toEqual([])
  })

  it('returns empty array when user avoids nothing', () => {
    expect(findAllergenConflicts(['gluten', 'milk'], [])).toEqual([])
  })

  it('returns empty array when there are no conflicts', () => {
    expect(findAllergenConflicts(['soy', 'eggs'], ['gluten', 'milk'])).toEqual([])
  })

  it('returns conflicting allergens when there is overlap', () => {
    const conflicts = findAllergenConflicts(
      ['gluten', 'soy', 'milk'],
      ['gluten', 'nuts']
    )
    expect(conflicts).toEqual(['gluten'])
  })

  it('returns multiple conflicts', () => {
    const conflicts = findAllergenConflicts(
      ['gluten', 'milk', 'eggs'],
      ['gluten', 'eggs']
    )
    expect(conflicts).toEqual(['gluten', 'eggs'])
  })

  it('returns all product allergens when user avoids all of them', () => {
    const conflicts = findAllergenConflicts(
      ['gluten', 'milk'],
      ['gluten', 'milk', 'soy', 'nuts', 'eggs']
    )
    expect(conflicts).toEqual(['gluten', 'milk'])
  })

  it('is case-insensitive for matching', () => {
    const conflicts = findAllergenConflicts(
      ['Gluten', 'MILK'],
      ['gluten', 'milk']
    )
    expect(conflicts).toEqual(['Gluten', 'MILK'])
  })

  it('handles mixed-case avoided allergens', () => {
    const conflicts = findAllergenConflicts(
      ['gluten'],
      ['GLUTEN']
    )
    expect(conflicts).toEqual(['gluten'])
  })

  it('returns empty for both undefined/empty', () => {
    expect(findAllergenConflicts(undefined, [])).toEqual([])
    expect(findAllergenConflicts([], [])).toEqual([])
  })
})
