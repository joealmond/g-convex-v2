import { describe, expect, it } from 'vitest'

import { findAllergenConflicts } from './dietary-profiles'

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
    expect(findAllergenConflicts(['gluten', 'soy', 'milk'], ['gluten', 'nuts'])).toEqual([
      'gluten',
    ])
  })

  it('returns multiple conflicts', () => {
    expect(findAllergenConflicts(['gluten', 'milk', 'eggs'], ['gluten', 'eggs'])).toEqual([
      'gluten',
      'eggs',
    ])
  })

  it('is case-insensitive for matching', () => {
    expect(findAllergenConflicts(['Gluten', 'MILK'], ['gluten', 'milk'])).toEqual([
      'Gluten',
      'MILK',
    ])
  })
})